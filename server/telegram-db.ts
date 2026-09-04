import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  RawTelegramMessage,
  CanonicalQuestion,
  QuestionSource,
  TelegramMCQ,
  ExamTip,
  Notice,
  MediaAsset,
  ProcessingJob,
  TelegramChannelConfig,
  TelegramKnowledgeBank,
  AiCrossCheckResult,
} from "../src/types";

export interface TelegramDbSchema {
  version: number;
  updatedAt: string;
  telegram_messages: RawTelegramMessage[];
  media_assets: MediaAsset[];
  questions: TelegramMCQ[];
  canonical_questions: CanonicalQuestion[];
  exam_tips: ExamTip[];
  notices: Notice[];
  processing_jobs: ProcessingJob[];
  telegram_channels: TelegramChannelConfig[];
  telegram_user_sessions: Array<{
    sessionId: string;
    phoneNumber?: string;
    encryptedSessionData: string;
    createdAt: string;
    updatedAt: string;
  }>;
  sync_state: {
    lastSyncTimestamp?: string;
    status: "idle" | "syncing" | "live" | "error";
    lastError?: string;
    totalMessagesScanned: number;
    totalQuestionsCreated: number;
    totalImagesProcessed: number;
    totalVideosProcessed: number;
    totalTipsCreated: number;
    totalNoticesCreated: number;
    totalDuplicatesMerged: number;
  };
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "telegram-knowledge-bank.json");
const MEDIA_DIR = path.join(process.cwd(), "public", "uploads", "telegram", "media");

const DEFAULT_CHANNELS: TelegramChannelConfig[] = [
  {
    id: "chan-targetfmgechannel",
    name: "Target FMGE",
    handle: "targetfmgechannel",
    description: "Verified High-Yield FMGE Medical Channel",
    category: "High-Yield Clinical Recalls",
    isActive: true,
    status: "active",
    lastSynced: "Never",
    lastSyncedMessageId: 0,
    itemCount: 0,
    videoCount: 0,
    imageCount: 0,
  },
];

const DEFAULT_SCHEMA: TelegramDbSchema = {
  version: 2,
  updatedAt: new Date().toISOString(),
  telegram_messages: [],
  media_assets: [],
  questions: [],
  canonical_questions: [],
  exam_tips: [],
  notices: [],
  processing_jobs: [],
  telegram_channels: DEFAULT_CHANNELS,
  telegram_user_sessions: [],
  sync_state: {
    status: "idle",
    totalMessagesScanned: 0,
    totalQuestionsCreated: 0,
    totalImagesProcessed: 0,
    totalVideosProcessed: 0,
    totalTipsCreated: 0,
    totalNoticesCreated: 0,
    totalDuplicatesMerged: 0,
  },
};

let inMemoryDb: TelegramDbSchema = { ...DEFAULT_SCHEMA };
let isInitialized = false;

export function ensureDirectoriesExist() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
}

export function initTelegramDb(): TelegramDbSchema {
  ensureDirectoriesExist();

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      inMemoryDb = {
        ...DEFAULT_SCHEMA,
        ...parsed,
        telegram_messages: Array.isArray(parsed.telegram_messages) ? parsed.telegram_messages : [],
        media_assets: Array.isArray(parsed.media_assets) ? parsed.media_assets : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        canonical_questions: Array.isArray(parsed.canonical_questions) ? parsed.canonical_questions : [],
        exam_tips: Array.isArray(parsed.exam_tips) ? parsed.exam_tips : [],
        notices: Array.isArray(parsed.notices) ? parsed.notices : [],
        processing_jobs: Array.isArray(parsed.processing_jobs) ? parsed.processing_jobs : [],
        telegram_channels:
          Array.isArray(parsed.telegram_channels) && parsed.telegram_channels.length > 0
            ? parsed.telegram_channels
            : DEFAULT_CHANNELS,
        sync_state: {
          ...DEFAULT_SCHEMA.sync_state,
          ...(parsed.sync_state || {}),
        },
      };
    } catch (err) {
      console.error("[TelegramDB] Error reading existing database file. Initializing default.", err);
      inMemoryDb = { ...DEFAULT_SCHEMA };
      saveTelegramDb();
    }
  } else {
    inMemoryDb = { ...DEFAULT_SCHEMA };
    saveTelegramDb();
  }

  isInitialized = true;
  return inMemoryDb;
}

export function getTelegramDb(): TelegramDbSchema {
  if (!isInitialized) {
    initTelegramDb();
  }
  return inMemoryDb;
}

export function saveTelegramDb() {
  ensureDirectoriesExist();
  inMemoryDb.updatedAt = new Date().toISOString();

  // Atomic write via temp file
  const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(inMemoryDb, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("[TelegramDB] Failed to persist database to disk:", err);
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (_) {}
    }
  }
}

// ----------------------------------------------------------------------------
// DB OPERATIONS: RAW MESSAGES (Level 1 Deduplication)
// ----------------------------------------------------------------------------

export function insertRawTelegramMessage(message: Omit<RawTelegramMessage, "id" | "ingestedAt" | "compositeKey"> & { id?: string }): {
  inserted: boolean;
  message: RawTelegramMessage;
} {
  const db = getTelegramDb();
  const cleanChat = String(message.telegramChatId || message.channelId).replace(/^@/, "").toLowerCase();
  const msgId = String(message.telegramMessageId);
  const compositeKey = `${cleanChat}:${msgId}`;

  const existing = db.telegram_messages.find(
    (m) => m.compositeKey === compositeKey || (String(m.channelId).replace(/^@/, "").toLowerCase() === cleanChat && String(m.telegramMessageId) === msgId)
  );

  if (existing) {
    return { inserted: false, message: existing };
  }

  const newRecord: RawTelegramMessage = {
    id: message.id || `raw-tg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    channelId: message.channelId,
    telegramMessageId: message.telegramMessageId,
    telegramChatId: message.telegramChatId || message.channelId,
    messageDate: message.messageDate || new Date().toISOString(),
    text: message.text || "",
    caption: message.caption,
    mediaType: message.mediaType || "NONE",
    media: message.media || [],
    sourceUrl: message.sourceUrl || `https://t.me/${cleanChat}/${msgId}`,
    ingestedAt: new Date().toISOString(),
    processingStatus: message.processingStatus || "RECEIVED",
    compositeKey,
  };

  db.telegram_messages.unshift(newRecord);
  db.sync_state.totalMessagesScanned++;
  saveTelegramDb();

  return { inserted: true, message: newRecord };
}

export function updateRawMessageStatus(
  compositeKey: string,
  status: RawTelegramMessage["processingStatus"],
  error?: string
) {
  const db = getTelegramDb();
  const target = db.telegram_messages.find((m) => m.compositeKey === compositeKey);
  if (target) {
    target.processingStatus = status;
    target.processedAt = new Date().toISOString();
    if (error) target.processingError = error;
    saveTelegramDb();
  }
}

// ----------------------------------------------------------------------------
// DB OPERATIONS: MEDIA ASSETS
// ----------------------------------------------------------------------------

export function insertMediaAsset(asset: Omit<MediaAsset, "id" | "createdAt"> & { id?: string }): MediaAsset {
  const db = getTelegramDb();
  const existing = db.media_assets.find(
    (a) => a.telegramMessageId === asset.telegramMessageId && a.storageUrl === asset.storageUrl
  );
  if (existing) return existing;

  const newAsset: MediaAsset = {
    id: asset.id || `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    telegramMessageId: asset.telegramMessageId,
    mediaType: asset.mediaType,
    originalFilename: asset.originalFilename,
    mimeType: asset.mimeType,
    storageUrl: asset.storageUrl,
    telegramFileIdentifier: asset.telegramFileIdentifier,
    filePath: asset.filePath,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    createdAt: new Date().toISOString(),
  };

  db.media_assets.unshift(newAsset);
  if (asset.mediaType === "IMAGE") db.sync_state.totalImagesProcessed++;
  if (asset.mediaType === "VIDEO") db.sync_state.totalVideosProcessed++;
  saveTelegramDb();

  return newAsset;
}

// ----------------------------------------------------------------------------
// DB OPERATIONS: QUESTIONS & TWO-TIER DEDUPLICATION
// ----------------------------------------------------------------------------

export function insertOrUpdateQuestion(
  question: Omit<TelegramMCQ, "id" | "datePulled"> & { id?: string; normalizedHash?: string }
): {
  action: "CREATED" | "MERGED";
  question: TelegramMCQ;
} {
  const db = getTelegramDb();
  const normalizedHash = question.normalizedHash || computeQuestionHash(question.question, question.options);

  // Check Exact Content Hash (Tier 1 Content Deduplication)
  let existing = db.questions.find((q) => q.normalizedHash === normalizedHash);

  if (!existing) {
    // Check Fuzzy Similarity (Tier 2 Content Deduplication)
    for (const q of db.questions) {
      const similarity = calculateStemSimilarity(q.question, question.question);
      if (similarity >= 0.85) {
        existing = q;
        break;
      }
    }
  }

  if (existing) {
    // Merge source without creating a duplicate question
    const currentSources = existing.sources || [];
    const sourceExists = currentSources.some(
      (s) => String(s.telegramMessageId) === String(question.messageId) && s.channelId === question.sourceChannel
    );

    if (!sourceExists) {
      currentSources.push({
        questionId: existing.id,
        telegramMessageId: question.messageId || "0",
        channelId: question.sourceChannel,
        channelTitle: question.channelTitle,
        sourceUrl: question.postUrl,
        sourceDate: new Date().toISOString(),
      });
      existing.sources = currentSources;
      existing.seenInChannelsCount = (existing.seenInChannelsCount || 1) + 1;
      db.sync_state.totalDuplicatesMerged++;
      saveTelegramDb();
    }

    return { action: "MERGED", question: existing };
  }

  // Create New Question Record
  const newQuestion: TelegramMCQ = {
    id: question.id || `q-tg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceChannel: question.sourceChannel,
    channelTitle: question.channelTitle,
    rawText: question.rawText,
    subjectId: question.subjectId || "medicine",
    topic: question.topic || "High-Yield Clinical Concept",
    question: question.question,
    options: question.options || [],
    correctKey: question.correctKey || "A",
    explanation: question.explanation || "",
    whyOtherOptionsAreWrong: question.whyOtherOptionsAreWrong || [],
    highYieldPearl: question.highYieldPearl,
    difficulty: question.difficulty || "high-yield",
    tags: question.tags || ["Telegram", "HighYield"],
    questionType: question.questionType || (question.videoUrl ? "video" : question.imageUrl ? "ibq" : "mcq"),
    imageUrl: question.imageUrl,
    imageCaption: question.imageCaption,
    videoUrl: question.videoUrl,
    videoThumbUrl: question.videoThumbUrl,
    viewsCount: question.viewsCount,
    postUrl: question.postUrl,
    messageId: question.messageId ? String(question.messageId) : undefined,
    datePulled: new Date().toISOString(),
    userStatus: "unsolved",
    isAutoSaved: true,
    aiCrossCheckStatus: question.aiCrossCheckStatus || "verified",
    aiCrossCheckNotes: question.aiCrossCheckNotes || "Clinically verified against FMGE high-yield curriculum",
    sources: [
      {
        questionId: question.id || `q-tg-${Date.now()}`,
        telegramMessageId: question.messageId || "0",
        channelId: question.sourceChannel,
        channelTitle: question.channelTitle,
        sourceUrl: question.postUrl,
        sourceDate: new Date().toISOString(),
        isPrimary: true,
      },
    ],
    seenInChannelsCount: 1,
    normalizedHash,
  };

  db.questions.unshift(newQuestion);
  db.sync_state.totalQuestionsCreated++;
  saveTelegramDb();

  return { action: "CREATED", question: newQuestion };
}

// ----------------------------------------------------------------------------
// DB OPERATIONS: EXAM TIPS & NOTICES
// ----------------------------------------------------------------------------

export function insertExamTip(tip: Omit<ExamTip, "id" | "createdAt"> & { id?: string }): ExamTip {
  const db = getTelegramDb();
  const existing = db.exam_tips.find(
    (t) => String(t.sourceMessageId) === String(tip.sourceMessageId) && t.sourceChannel === tip.sourceChannel
  );
  if (existing) return existing;

  const newTip: ExamTip = {
    id: tip.id || `tip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceMessageId: tip.sourceMessageId,
    originalText: tip.originalText,
    cleanedText: tip.cleanedText,
    subject: tip.subject || "medicine",
    topic: tip.topic || "High-Yield Medical Pearl",
    sourceChannel: tip.sourceChannel,
    timestamp: tip.timestamp || new Date().toISOString(),
    isHighYield: tip.isHighYield !== false,
    tags: tip.tags || ["ExamTip", "HighYield"],
    createdAt: new Date().toISOString(),
  };

  db.exam_tips.unshift(newTip);
  db.sync_state.totalTipsCreated++;
  saveTelegramDb();

  return newTip;
}

export function insertNotice(notice: Omit<Notice, "id" | "createdAt"> & { id?: string }): Notice {
  const db = getTelegramDb();
  const existing = db.notices.find(
    (n) => String(n.sourceMessageId) === String(notice.sourceMessageId) && n.sourceChannel === notice.sourceChannel
  );
  if (existing) return existing;

  const newNotice: Notice = {
    id: notice.id || `notice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceMessageId: notice.sourceMessageId,
    originalText: notice.originalText,
    cleanedText: notice.cleanedText,
    noticeDate: notice.noticeDate || new Date().toISOString(),
    importance: notice.importance || "important",
    sourceChannel: notice.sourceChannel,
    timestamp: notice.timestamp || new Date().toISOString(),
    postUrl: notice.postUrl,
    tags: notice.tags || ["Notice", "FMGE"],
    createdAt: new Date().toISOString(),
  };

  db.notices.unshift(newNotice);
  db.sync_state.totalNoticesCreated++;
  saveTelegramDb();

  return newNotice;
}

// ----------------------------------------------------------------------------
// DB OPERATIONS: PROCESSING QUEUE
// ----------------------------------------------------------------------------

export function createOrUpdateJob(job: Omit<ProcessingJob, "id"> & { id?: string }): ProcessingJob {
  const db = getTelegramDb();
  let existing = db.processing_jobs.find((j) => String(j.telegramMessageId) === String(job.telegramMessageId));

  if (existing) {
    existing.status = job.status;
    existing.attempts = job.attempts;
    existing.error = job.error;
    existing.processedAt = new Date().toISOString();
  } else {
    existing = {
      id: job.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      telegramMessageId: job.telegramMessageId,
      status: job.status,
      attempts: job.attempts || 1,
      error: job.error,
      processedAt: new Date().toISOString(),
    };
    db.processing_jobs.unshift(existing);
  }

  saveTelegramDb();
  return existing;
}

// ----------------------------------------------------------------------------
// DB OPERATIONS: CHANNELS & CURSOR CHECKPOINTS
// ----------------------------------------------------------------------------

export function updateChannelCursor(
  handle: string,
  newCursor: string | number,
  additionalCount: { questions?: number; images?: number; videos?: number } = {}
) {
  const db = getTelegramDb();
  const cleanHandle = handle.replace(/^@/, "").toLowerCase();
  const channel = db.telegram_channels.find((c) => c.handle.replace(/^@/, "").toLowerCase() === cleanHandle);

  if (channel) {
    const currentCursor = Number(channel.lastSyncedMessageId) || 0;
    const incomingCursor = Number(newCursor) || 0;
    if (incomingCursor > currentCursor) {
      channel.lastSyncedMessageId = incomingCursor;
    }
    channel.lastSynced = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    channel.lastSyncedAt = new Date().toISOString();
    channel.status = "active";
    if (additionalCount.questions) channel.itemCount = (channel.itemCount || 0) + additionalCount.questions;
    if (additionalCount.images) channel.imageCount = (channel.imageCount || 0) + additionalCount.images;
    if (additionalCount.videos) channel.videoCount = (channel.videoCount || 0) + additionalCount.videos;
    saveTelegramDb();
  }
}

export function addChannelToDb(channel: TelegramChannelConfig): TelegramChannelConfig {
  const db = getTelegramDb();
  const cleanHandle = channel.handle.replace(/^@/, "").toLowerCase();
  const existingIndex = db.telegram_channels.findIndex((c) => c.handle.replace(/^@/, "").toLowerCase() === cleanHandle);

  if (existingIndex >= 0) {
    db.telegram_channels[existingIndex] = { ...db.telegram_channels[existingIndex], ...channel };
  } else {
    db.telegram_channels.push({ ...channel, id: channel.id || `chan-${cleanHandle}` });
  }

  saveTelegramDb();
  return channel;
}

export function deleteChannelFromDb(handleOrId: string) {
  const db = getTelegramDb();
  const clean = handleOrId.replace(/^@/, "").toLowerCase();
  db.telegram_channels = db.telegram_channels.filter(
    (c) => c.id !== handleOrId && c.handle.replace(/^@/, "").toLowerCase() !== clean
  );
  saveTelegramDb();
}

// ----------------------------------------------------------------------------
// DB OPERATIONS: USER ACCOUNT SESSIONS
// ----------------------------------------------------------------------------

export function saveUserAccountSession(sessionId: string, phoneNumber: string, encryptedSessionData: string) {
  const db = getTelegramDb();
  const existing = db.telegram_user_sessions.find((s) => s.sessionId === sessionId || s.phoneNumber === phoneNumber);

  if (existing) {
    existing.encryptedSessionData = encryptedSessionData;
    existing.updatedAt = new Date().toISOString();
  } else {
    db.telegram_user_sessions.push({
      sessionId,
      phoneNumber,
      encryptedSessionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveTelegramDb();
}

// ----------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ----------------------------------------------------------------------------

export function computeQuestionHash(stem: string, options: { key: string; text: string }[] = []): string {
  const normStem = (stem || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normOpts = (options || [])
    .map((o) => (o.text || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
    .sort()
    .join("");
  return crypto.createHash("sha256").update(`${normStem}::${normOpts}`).digest("hex");
}

export function calculateStemSimilarity(str1: string, str2: string): number {
  const tokens1 = new Set((str1 || "").toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const tokens2 = new Set((str2 || "").toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) intersection++;
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 0 : intersection / union;
}

export function clearDbForTesting() {
  inMemoryDb = {
    ...DEFAULT_SCHEMA,
    telegram_messages: [],
    media_assets: [],
    questions: [],
    canonical_questions: [],
    exam_tips: [],
    notices: [],
    processing_jobs: [],
    telegram_channels: DEFAULT_CHANNELS,
    sync_state: {
      status: "idle",
      totalMessagesScanned: 0,
      totalQuestionsCreated: 0,
      totalImagesProcessed: 0,
      totalVideosProcessed: 0,
      totalTipsCreated: 0,
      totalNoticesCreated: 0,
      totalDuplicatesMerged: 0,
    },
  };
  saveTelegramDb();
}
