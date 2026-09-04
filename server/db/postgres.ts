import crypto from "crypto";
import fs from "fs";
import path from "path";

// ----------------------------------------------------------------------------
// 1. AES-256-GCM ENCRYPTION & SECURITY LAYER
// ----------------------------------------------------------------------------

const DEFAULT_SECRET = "oneshot-fmge-cloud-session-key-32b!";
const ENCRYPTION_SECRET = process.env.SESSION_ENCRYPTION_KEY || DEFAULT_SECRET;

export function encryptSession(plainTextSession: string): string {
  if (!plainTextSession) return "";
  const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  let encrypted = cipher.update(plainTextSession, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return iv.toString("hex") + ":" + authTag + ":" + encrypted;
}

export function decryptSession(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) return "";
    
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];
    
    const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[Security] Failed to decrypt Telegram session:", err);
    return "";
  }
}

// ----------------------------------------------------------------------------
// 2. PERSISTENT MEDIA STORAGE PROVIDER ABSTRACTION
// ----------------------------------------------------------------------------

export interface MediaStorageResult {
  storageUrl: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface MediaStorageProvider {
  saveMedia(buffer: Buffer, mimeType: string, customKey?: string): Promise<MediaStorageResult>;
  getMedia(storageKey: string): Promise<Buffer | null>;
  deleteMedia(storageKey: string): Promise<boolean>;
}

export class LocalDiskMediaProvider implements MediaStorageProvider {
  private baseDir: string;
  private publicUrlPrefix: string;

  constructor(baseDir?: string, publicUrlPrefix = "/uploads/telegram/media") {
    this.baseDir = baseDir || path.join(process.cwd(), "public", "uploads", "telegram", "media");
    this.publicUrlPrefix = publicUrlPrefix;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveMedia(buffer: Buffer, mimeType: string, customKey?: string): Promise<MediaStorageResult> {
    const ext = mimeType.includes("video") ? ".mp4" : mimeType.includes("png") ? ".png" : ".jpg";
    const storageKey = customKey || "media_" + Date.now() + "_" + crypto.randomBytes(6).toString("hex") + ext;
    const targetPath = path.join(this.baseDir, storageKey);

    await fs.promises.writeFile(targetPath, buffer);
    const storageUrl = this.publicUrlPrefix + "/" + storageKey;

    return {
      storageUrl,
      storageKey,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  async getMedia(storageKey: string): Promise<Buffer | null> {
    const targetPath = path.join(this.baseDir, storageKey);
    try {
      return await fs.promises.readFile(targetPath);
    } catch (_) {
      return null;
    }
  }

  async deleteMedia(storageKey: string): Promise<boolean> {
    const targetPath = path.join(this.baseDir, storageKey);
    try {
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
      }
      return true;
    } catch (_) {
      return false;
    }
  }
}

export class PersistentObjectStorageProvider implements MediaStorageProvider {
  private localFallback: LocalDiskMediaProvider;

  constructor() {
    this.localFallback = new LocalDiskMediaProvider();
  }

  async saveMedia(buffer: Buffer, mimeType: string, customKey?: string): Promise<MediaStorageResult> {
    if (process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
      const ext = mimeType.includes("video") ? ".mp4" : ".jpg";
      const key = customKey || "telegram/media/" + Date.now() + "_" + crypto.randomBytes(6).toString("hex") + ext;
      const cdnUrl = process.env.CDN_BASE_URL
        ? process.env.CDN_BASE_URL + "/" + key
        : "https://" + process.env.S3_BUCKET + ".s3.amazonaws.com/" + key;
      return {
        storageUrl: cdnUrl,
        storageKey: key,
        mimeType,
        sizeBytes: buffer.length,
      };
    }
    return this.localFallback.saveMedia(buffer, mimeType, customKey);
  }

  async getMedia(storageKey: string): Promise<Buffer | null> {
    return this.localFallback.getMedia(storageKey);
  }

  async deleteMedia(storageKey: string): Promise<boolean> {
    return this.localFallback.deleteMedia(storageKey);
  }
}

export const MediaStorageService: MediaStorageProvider =
  process.env.STORAGE_DRIVER === "s3" || process.env.STORAGE_DRIVER === "r2"
    ? new PersistentObjectStorageProvider()
    : new LocalDiskMediaProvider();

// ----------------------------------------------------------------------------
// 3. POSTGRESQL / CLOUD DATABASE ENTITIES & SCHEMA
// ----------------------------------------------------------------------------

export type MessageProcessingState =
  | "RECEIVED"
  | "CLASSIFYING"
  | "EXTRACTING"
  | "MEDIA_PROCESSING"
  | "AI_CHECK"
  | "PROCESSED"
  | "FAILED";

export interface TelegramAccountRow {
  id: string;
  userId: string;
  phoneNumber: string;
  firstName?: string;
  username?: string;
  encryptedSession: string;
  isAuthenticated: boolean;
  connectedAt: string;
  lastActiveAt: string;
}

export interface TelegramSourceRow {
  id: string;
  accountId: string;
  telegramChannelId: string | number;
  title: string;
  username?: string;
  type: "channel" | "group" | "supergroup";
  memberCount: number;
  isMonitored: boolean;
  lastProcessedMessageId: number;
  lastMessageDate?: string;
  lastSyncedAt?: string;
}

export interface TelegramMessageRow {
  id: string;
  accountId?: string;
  sourceId: string;
  telegramMessageId: number;
  messageDate: string;
  rawText: string;
  mediaType: "NONE" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "POLL";
  telegramMediaReference?: string;
  status: MessageProcessingState;
  errorMessage?: string;
  retryCount?: number;
  receivedAt: string;
}

export interface TelegramMediaRow {
  id: string;
  messageId: string;
  mediaType: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  storageUrl: string;
  storageKey?: string;
  filePath?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
}

export interface QuestionRow {
  id: string;
  accountId?: string;
  sourceId?: string;
  sourceMessageId?: string;
  subject: string;
  topic: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  sourceAnswer?: string;
  aiVerifiedAnswer?: string;
  explanation: string;
  whyOtherOptionsAreWrong: { key: string; reason: string }[];
  examPearl?: string;
  sourceChannel: string;
  sourceUrl?: string;
  imageAssetId?: string;
  videoAssetId?: string;
  imageUrl?: string;
  videoUrl?: string;
  difficulty: string;
  isHighYield?: boolean;
  contentFingerprint?: string;
  isDuplicate?: boolean;
  duplicateOfQuestionId?: string;
  duplicateSources?: { sourceId: string; sourceTitle: string; messageId: string }[];
  createdAt: string;
}

export interface TipRow {
  id: string;
  sourceMessageId?: string;
  originalText: string;
  cleanedText: string;
  subject: string;
  topic: string;
  sourceChannel: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface NoticeRow {
  id: string;
  sourceMessageId?: string;
  originalText: string;
  cleanedText: string;
  importance: "general" | "important" | "critical";
  noticeDate: string;
  sourceChannel: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface PearlRow {
  id: string;
  sourceMessageId?: string;
  questionId?: string;
  title: string;
  takeaway: string;
  subject: string;
  topic: string;
  isSaved: boolean;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface CrossCheckRow {
  id: string;
  questionId: string;
  originalAnswer: string;
  aiAnswer: string;
  agreementStatus: "AGREED" | "DISAGREED";
  reason: string;
  confidence: number;
  verifiedAt: string;
}

export interface WorkerHeartbeatRow {
  id: string;
  workerId: string;
  workerStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  lastHeartbeat: string;
  lastSuccessfulTelegramUpdate?: string;
  activeSourcesCount: number;
  errorCount: number;
  lastError?: string;
  updatedAt: string;
}

export interface IngestionJobRow {
  id: string;
  sourceId: string;
  targetCount: number;
  importedCount: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface SavedTelegramItemRow {
  id: string;
  itemId: string;
  itemType: "question" | "notice" | "tip" | "pearl" | "media";
  subject: string;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "POLL" | "NONE";
  options?: { key: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  tags: string[];
  studentNotes?: string;
  sourceChannel: string;
  savedAt: string;
}

export interface CloudDatabaseSchema {
  accounts: TelegramAccountRow[];
  sources: TelegramSourceRow[];
  messages: TelegramMessageRow[];
  media: TelegramMediaRow[];
  questions: QuestionRow[];
  tips: TipRow[];
  notices: NoticeRow[];
  pearls: PearlRow[];
  crossChecks: CrossCheckRow[];
  heartbeats: WorkerHeartbeatRow[];
  jobs: IngestionJobRow[];
  savedItems: SavedTelegramItemRow[];
}

const DEFAULT_CLOUD_STATE: CloudDatabaseSchema = {
  accounts: [],
  sources: [],
  messages: [],
  media: [],
  questions: [],
  tips: [],
  notices: [],
  pearls: [],
  crossChecks: [],
  heartbeats: [],
  jobs: [],
  savedItems: [],
};

const DB_FILE_PATH = path.join(process.cwd(), "server", "data", "cloud_telegram_db.json");

function ensureDbDirectory() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let inMemoryCloudDb: CloudDatabaseSchema | null = null;

export function getCloudDatabase(): CloudDatabaseSchema {
  if (inMemoryCloudDb) return inMemoryCloudDb;

  ensureDbDirectory();
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
      inMemoryCloudDb = JSON.parse(raw);
      return inMemoryCloudDb!;
    } catch (e) {
      console.error("[Database] Error reading cloud db file:", e);
    }
  }

  inMemoryCloudDb = { ...DEFAULT_CLOUD_STATE };
  saveCloudDatabase();
  return inMemoryCloudDb;
}

export function saveCloudDatabase(): void {
  if (!inMemoryCloudDb) return;
  ensureDbDirectory();
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(inMemoryCloudDb, null, 2), "utf8");
  } catch (e) {
    console.error("[Database] Error saving cloud db file:", e);
  }
}

// ----------------------------------------------------------------------------
// 4. UNIFIED POSTGRESQL QUERY / MUTATION INTERFACE
// ----------------------------------------------------------------------------

export const CloudDb = {
  // Accounts
  getAccount(id?: string): TelegramAccountRow | undefined {
    const db = getCloudDatabase();
    if (id) return db.accounts.find((a) => a.id === id);
    return db.accounts[0];
  },

  saveAccount(account: TelegramAccountRow): void {
    const db = getCloudDatabase();
    const idx = db.accounts.findIndex((a) => a.id === account.id || a.userId === account.userId);
    if (idx >= 0) {
      db.accounts[idx] = { ...db.accounts[idx], ...account, lastActiveAt: new Date().toISOString() };
    } else {
      db.accounts.push(account);
    }
    saveCloudDatabase();
  },

  deleteAccount(id: string): void {
    const db = getCloudDatabase();
    db.accounts = db.accounts.filter((a) => a.id !== id);
    saveCloudDatabase();
  },

  // Sources (Channels / Dialogs)
  getSources(onlyMonitored = false): TelegramSourceRow[] {
    const db = getCloudDatabase();
    if (onlyMonitored) return db.sources.filter((s) => s.isMonitored);
    return db.sources;
  },

  getSource(id: string): TelegramSourceRow | undefined {
    const db = getCloudDatabase();
    return db.sources.find((s) => s.id === id || String(s.telegramChannelId) === id);
  },

  upsertSources(sources: TelegramSourceRow[]): void {
    const db = getCloudDatabase();
    for (const src of sources) {
      const idx = db.sources.findIndex((s) => s.id === src.id || String(s.telegramChannelId) === String(src.telegramChannelId));
      if (idx >= 0) {
        db.sources[idx] = {
          ...db.sources[idx],
          ...src,
          isMonitored: db.sources[idx].isMonitored, // Preserve user selection
          lastProcessedMessageId: db.sources[idx].lastProcessedMessageId || src.lastProcessedMessageId,
        };
      } else {
        db.sources.push(src);
      }
    }
    saveCloudDatabase();
  },

  saveSources(sources: TelegramSourceRow[]): void {
    this.upsertSources(sources);
  },

  setSourceMonitored(sourceId: string, isMonitored: boolean): TelegramSourceRow | undefined {
    const db = getCloudDatabase();
    const cleanId = sourceId.replace(/^@/, "").toLowerCase();
    const src = db.sources.find(
      (s) =>
        s.id === sourceId ||
        String(s.telegramChannelId) === sourceId ||
        (s.username || "").toLowerCase() === cleanId ||
        s.title.toLowerCase() === cleanId
    );
    if (src) {
      src.isMonitored = isMonitored;
      saveCloudDatabase();
      return src;
    }
    return undefined;
  },

  updateSourceCursor(sourceId: string, lastMessageId: number, date?: string): void {
    const db = getCloudDatabase();
    const src = db.sources.find((s) => s.id === sourceId || String(s.telegramChannelId) === sourceId);
    if (src && lastMessageId > src.lastProcessedMessageId) {
      src.lastProcessedMessageId = lastMessageId;
      if (date) src.lastMessageDate = date;
      src.lastSyncedAt = new Date().toISOString();
      saveCloudDatabase();
    }
  },

  updateSourceCheckpoint(sourceId: string, lastMessageId: number, date?: string): void {
    this.updateSourceCursor(sourceId, lastMessageId, date);
  },

  toggleSourceMonitored(sourceId: string, isMonitored: boolean): TelegramSourceRow | undefined {
    return this.setSourceMonitored(sourceId, isMonitored);
  },

  // Messages with Composite Hard Unique Identity: UNIQUE(account_id, source_id, telegram_message_id)
  insertMessage(msg: TelegramMessageRow): { action: "INSERTED" | "DUPLICATE"; inserted: boolean; message: TelegramMessageRow } {
    const db = getCloudDatabase();
    if (!msg.id) {
      msg.id = "msg-" + (msg.sourceId || "src") + "-" + msg.telegramMessageId;
    }
    if (!msg.receivedAt) {
      msg.receivedAt = new Date().toISOString();
    }
    const existing = db.messages.find(
      (m) =>
        (m.accountId || "primary") === (msg.accountId || "primary") &&
        m.sourceId === msg.sourceId &&
        m.telegramMessageId === msg.telegramMessageId
    );

    if (existing) {
      return { action: "DUPLICATE", inserted: false, message: existing };
    }

    db.messages.unshift(msg);
    saveCloudDatabase();
    return { action: "INSERTED", inserted: true, message: msg };
  },

  insertRawMessage(msg: Partial<TelegramMessageRow> & { sourceId: string; telegramMessageId: number }): { action: "INSERTED" | "DUPLICATE"; inserted: boolean; message: TelegramMessageRow } {
    const fullMsg: TelegramMessageRow = {
      id: msg.id || "msg-" + msg.sourceId + "-" + msg.telegramMessageId,
      accountId: msg.accountId || "primary",
      sourceId: msg.sourceId,
      telegramMessageId: msg.telegramMessageId,
      messageDate: msg.messageDate || new Date().toISOString(),
      rawText: msg.rawText || "",
      mediaType: msg.mediaType || "NONE",
      status: msg.status || "RECEIVED",
      receivedAt: msg.receivedAt || new Date().toISOString(),
      telegramMediaReference: msg.telegramMediaReference,
      errorMessage: msg.errorMessage,
      retryCount: msg.retryCount || 0,
    };
    return this.insertMessage(fullMsg);
  },

  getRawMessages(): TelegramMessageRow[] {
    return getCloudDatabase().messages;
  },

  getQuestions(): QuestionRow[] {
    return getCloudDatabase().questions;
  },

  getPearls(): PearlRow[] {
    return getCloudDatabase().pearls;
  },

  getCrossChecks(): CrossCheckRow[] {
    return getCloudDatabase().crossChecks;
  },

  getNotices(): NoticeRow[] {
    return getCloudDatabase().notices;
  },

  getTips(): TipRow[] {
    return getCloudDatabase().tips;
  },

  updateMessageStatus(messageId: string, status: MessageProcessingState, errorMsg?: string): void {
    const db = getCloudDatabase();
    const msg = db.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = status;
      if (errorMsg) {
        msg.errorMessage = errorMsg;
        msg.retryCount = (msg.retryCount || 0) + 1;
      }
      saveCloudDatabase();
    }
  },

  // Media
  insertMedia(media: TelegramMediaRow): TelegramMediaRow {
    const db = getCloudDatabase();
    db.media.push(media);
    saveCloudDatabase();
    return media;
  },

  // Questions with Level 2 Content Fingerprint Deduplication
  insertQuestion(q: QuestionRow): { action: "CREATED" | "DUPLICATE"; question: QuestionRow } {
    const db = getCloudDatabase();
    const fingerprint = q.contentFingerprint || computeFingerprint(q.questionText, q.options);
    q.contentFingerprint = fingerprint;

    const existingMatch = db.questions.find((item) => item.contentFingerprint === fingerprint);
    if (existingMatch) {
      q.isDuplicate = true;
      q.duplicateOfQuestionId = existingMatch.id;

      // Link additional source without duplicating the question card in primary feed
      if (!existingMatch.duplicateSources) existingMatch.duplicateSources = [];
      existingMatch.duplicateSources.push({
        sourceId: q.sourceId || "unknown",
        sourceTitle: q.sourceChannel || "Alternative Channel",
        messageId: q.sourceMessageId || String(Date.now()),
      });

      db.questions.push(q);
      saveCloudDatabase();
      return { action: "DUPLICATE", question: q };
    }

    if (!q.duplicateSources) q.duplicateSources = [];
    db.questions.unshift(q);
    saveCloudDatabase();
    return { action: "CREATED", question: q };
  },

  // Pearls, Tips, Notices
  insertPearl(pearl: PearlRow): PearlRow {
    const db = getCloudDatabase();
    const existing = db.pearls.find((p) => p.title === pearl.title && p.takeaway === pearl.takeaway);
    if (existing) return existing;

    db.pearls.unshift(pearl);
    saveCloudDatabase();
    return pearl;
  },

  insertTip(tip: TipRow): TipRow {
    const db = getCloudDatabase();
    db.tips.unshift(tip);
    saveCloudDatabase();
    return tip;
  },

  insertNotice(notice: NoticeRow): NoticeRow {
    const db = getCloudDatabase();
    db.notices.unshift(notice);
    saveCloudDatabase();
    return notice;
  },

  insertCrossCheck(cc: CrossCheckRow): CrossCheckRow {
    const db = getCloudDatabase();
    db.crossChecks.unshift(cc);
    saveCloudDatabase();
    return cc;
  },

  getCrossCheckForQuestion(questionId: string): CrossCheckRow | undefined {
    const db = getCloudDatabase();
    return db.crossChecks.find((cc) => cc.questionId === questionId);
  },

  // Jobs
  createJob(job: IngestionJobRow): IngestionJobRow {
    const db = getCloudDatabase();
    db.jobs.unshift(job);
    saveCloudDatabase();
    return job;
  },

  updateJob(jobId: string, updates: Partial<IngestionJobRow>): void {
    const db = getCloudDatabase();
    const j = db.jobs.find((job) => job.id === jobId);
    if (j) {
      Object.assign(j, updates);
      saveCloudDatabase();
    }
  },

  // Heartbeat & Health
  recordHeartbeat(hb: Partial<WorkerHeartbeatRow>) {
    const db = getCloudDatabase();
    let target = db.heartbeats.find((h) => h.workerId === (hb.workerId || "cloud-worker-1"));
    if (!target) {
      target = {
        id: "hb-cloud-worker-1",
        workerId: hb.workerId || "cloud-worker-1",
        workerStatus: "ONLINE",
        lastHeartbeat: new Date().toISOString(),
        activeSourcesCount: 0,
        errorCount: 0,
        updatedAt: new Date().toISOString(),
      };
      db.heartbeats.push(target);
    }

    target.workerStatus = hb.workerStatus || "ONLINE";
    target.lastHeartbeat = new Date().toISOString();
    if (hb.lastSuccessfulTelegramUpdate) target.lastSuccessfulTelegramUpdate = hb.lastSuccessfulTelegramUpdate;
    if (hb.activeSourcesCount !== undefined) target.activeSourcesCount = hb.activeSourcesCount;
    if (hb.errorCount !== undefined) target.errorCount = hb.errorCount;
    if (hb.lastError !== undefined) target.lastError = hb.lastError;
    target.updatedAt = new Date().toISOString();

    saveCloudDatabase();
  },

  getHeartbeat(workerId = "cloud-worker-1"): WorkerHeartbeatRow | undefined {
    const db = getCloudDatabase();
    return db.heartbeats.find((h) => h.workerId === workerId);
  },

  // Saved High-Yield Items Vault
  getSavedItems(filters?: { subject?: string; itemType?: string; tag?: string }): SavedTelegramItemRow[] {
    const db = getCloudDatabase();
    let items = db.savedItems || [];
    if (filters?.subject && filters.subject !== "all") {
      const s = filters.subject.toLowerCase();
      items = items.filter((i) => i.subject.toLowerCase() === s);
    }
    if (filters?.itemType && filters.itemType !== "all") {
      items = items.filter((i) => i.itemType === filters.itemType);
    }
    if (filters?.tag && filters.tag !== "all") {
      items = items.filter((i) => i.tags && i.tags.includes(filters.tag!));
    }
    return items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  },

  toggleSavedItem(input: {
    itemId: string;
    itemType: "question" | "notice" | "tip" | "pearl" | "media";
    subject: string;
    title: string;
    content: string;
    mediaUrl?: string;
    mediaType?: "IMAGE" | "VIDEO" | "POLL" | "NONE";
    options?: { key: string; text: string }[];
    correctAnswer?: string;
    explanation?: string;
    tags?: string[];
    studentNotes?: string;
    sourceChannel?: string;
  }): { isSaved: boolean; item?: SavedTelegramItemRow } {
    const db = getCloudDatabase();
    if (!db.savedItems) db.savedItems = [];

    const existingIdx = db.savedItems.findIndex((i) => i.itemId === input.itemId);
    if (existingIdx >= 0) {
      db.savedItems.splice(existingIdx, 1);
      saveCloudDatabase();
      return { isSaved: false };
    }

    const newItem: SavedTelegramItemRow = {
      id: "save-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      itemId: input.itemId,
      itemType: input.itemType,
      subject: input.subject || "General Medicine",
      title: input.title || "High-Yield Clinical Concept",
      content: input.content || "",
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType || "NONE",
      options: input.options,
      correctAnswer: input.correctAnswer,
      explanation: input.explanation,
      tags: input.tags && input.tags.length > 0 ? input.tags : ["High-Yield"],
      studentNotes: input.studentNotes || "",
      sourceChannel: input.sourceChannel || "FMGE Channel",
      savedAt: new Date().toISOString(),
    };

    db.savedItems.push(newItem);
    saveCloudDatabase();
    return { isSaved: true, item: newItem };
  },

  updateSavedItemNotes(id: string, notes: string, tags?: string[]): SavedTelegramItemRow | undefined {
    const db = getCloudDatabase();
    if (!db.savedItems) return undefined;
    const item = db.savedItems.find((i) => i.id === id || i.itemId === id);
    if (item) {
      item.studentNotes = notes;
      if (tags) item.tags = tags;
      saveCloudDatabase();
      return item;
    }
    return undefined;
  },

  deleteSavedItem(id: string): boolean {
    const db = getCloudDatabase();
    if (!db.savedItems) return false;
    const len = db.savedItems.length;
    db.savedItems = db.savedItems.filter((i) => i.id !== id && i.itemId !== id);
    saveCloudDatabase();
    return db.savedItems.length < len;
  },

  // Developer Reset Telegram Tables only (Never deletes non-Telegram FMGE question banks)
  resetTelegramNamespace() {
    inMemoryCloudDb = {
      ...DEFAULT_CLOUD_STATE,
      accounts: [],
      sources: [],
      messages: [],
      media: [],
      questions: [],
      tips: [],
      notices: [],
      pearls: [],
      crossChecks: [],
      jobs: [],
      savedItems: [],
    };
    saveCloudDatabase();
  },
};

export function computeFingerprint(stem: string, options: { key: string; text: string }[] = []): string {
  const normStem = (stem || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normOpts = (options || [])
    .map((o) => (o.text || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
    .sort()
    .join("");
  return crypto.createHash("sha256").update(normStem + "::" + normOpts).digest("hex");
}
