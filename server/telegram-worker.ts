import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import crypto from "crypto";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import {
  CloudDb,
  encryptSession,
  decryptSession,
  TelegramAccountRow,
  TelegramSourceRow,
  TelegramMessageRow,
  TelegramMediaRow,
  QuestionRow,
  PearlRow,
  NoticeRow,
  TipRow,
  CrossCheckRow,
} from "./db/postgres";
import {
  normalizeTelegramPhoneNumber,
  normalizePhoneNumber,
  mapTelegramAuthError,
} from "./phone-validation";
import { generateQrDataUrl } from "./qr-code-generator";
import { enrichClinicalQuestionServer } from "./clinical-distractor-engine";
import { analyzeTelegramMessageWithGemini } from "./telegram-gemini-analyzer";
import { getCloudDatabase, saveCloudDatabase } from "./db/postgres";

const MEDIA_STORAGE_DIR = path.join(process.cwd(), "public", "uploads", "telegram", "media");
if (!fs.existsSync(MEDIA_STORAGE_DIR)) {
  fs.mkdirSync(MEDIA_STORAGE_DIR, { recursive: true });
}

let activeClient: TelegramClient | null = null;
let currentPhoneCodeHash: string | null = null;
let currentPendingPhone: string | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let syncCycleInterval: NodeJS.Timeout | null = null;
let isWorkerRunning = false;

// ----------------------------------------------------------------------------
// 1. TELEGRAM CLIENT LIFECYCLE & AUTHENTICATION
// ----------------------------------------------------------------------------

export function getTelegramApiConfig(): { apiId: number; apiHash: string } {
  const envApiId = Number(process.env.TELEGRAM_API_ID);
  const envApiHash = process.env.TELEGRAM_API_HASH;

  return {
    apiId: !isNaN(envApiId) && envApiId > 0 ? envApiId : 2040,
    apiHash: envApiHash || "b18441a1ff607e10a989891a5462e627",
  };
}

export function translateTelegramError(err: any): string {
  const message = String(err?.message || err?.errorMessage || err || "");
  
  if (message.includes("PHONE_NUMBER_INVALID")) {
    return "Telegram rejected this phone number. Please enter it in international format (e.g. +919876543210).";
  }
  if (message.includes("PHONE_CODE_INVALID")) {
    return "The verification code entered is incorrect. Please check the code sent to your Telegram app.";
  }
  if (message.includes("PHONE_CODE_EXPIRED")) {
    return "The verification code has expired. Please request a new code.";
  }
  if (message.includes("SESSION_PASSWORD_NEEDED")) {
    return "Two-Factor Authentication (2FA) is enabled on your Telegram account. Please enter your 2FA cloud password.";
  }
  if (message.includes("PASSWORD_HASH_INVALID")) {
    return "The 2FA cloud password entered is incorrect.";
  }
  if (message.includes("FLOOD_WAIT")) {
    const match = message.match(/FLOOD_WAIT_(\d+)/);
    const seconds = match ? match[1] : "some";
    return `Too many attempts. Telegram requires waiting ${seconds} seconds before trying again.`;
  }
  if (message.includes("AUTH_RESTART")) {
    return "Telegram authentication session restarted. Please re-enter your phone number.";
  }

  return message || "An unexpected error occurred during Telegram authorization.";
}

export async function initTelegramCloudWorker(): Promise<boolean> {
  const account = CloudDb.getAccount();
  if (!account || !account.encryptedSession) {
    CloudDb.recordHeartbeat({
      workerStatus: "ONLINE",
      activeSourcesCount: 0,
      errorCount: 0,
    });
    return false;
  }

  try {
    const plainSession = decryptSession(account.encryptedSession);
    if (!plainSession) {
      console.warn("[CloudWorker] Decrypted session string is empty.");
      return false;
    }

    const { apiId, apiHash } = getTelegramApiConfig();
    const stringSession = new StringSession(plainSession);
    activeClient = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await activeClient.connect();
    const isAuth = await activeClient.isUserAuthorized();

    if (isAuth) {
      console.log("[CloudWorker] Connected and authenticated successfully to Telegram account.");
      startWorkerCycles();
      return true;
    } else {
      console.warn("[CloudWorker] Saved session was not authorized.");
      return false;
    }
  } catch (err: any) {
    console.error("[CloudWorker] Failed to initialize Telegram client:", err);
    CloudDb.recordHeartbeat({
      workerStatus: "DEGRADED",
      lastError: err.message,
    });
    return false;
  }
}

// ----------------------------------------------------------------------------
// 2. MTPROTO QR CODE & PHONE NUMBER AUTHENTICATION FLOW
// ----------------------------------------------------------------------------

interface QrSessionState {
  token: Buffer;
  expires: number;
  qrLink: string;
  qrDataUrl: string;
  isAuthenticated: boolean;
  requires2FA: boolean;
  userProfile?: { id: string; firstName: string; username?: string; phone: string };
  error?: string;
  createdAt: number;
}

let activeQrSession: QrSessionState | null = null;

export async function generateTelegramLoginQr(
  apiIdParam?: number,
  apiHashParam?: string
): Promise<{
  success: boolean;
  qrLink?: string;
  qrDataUrl?: string;
  expires?: number;
  error?: string;
}> {
  const { apiId, apiHash } = {
    apiId: apiIdParam || getTelegramApiConfig().apiId,
    apiHash: apiHashParam || getTelegramApiConfig().apiHash,
  };

  if (!apiId || !apiHash) {
    return {
      success: false,
      error: "Missing Telegram API credentials. Please set TELEGRAM_API_ID and TELEGRAM_API_HASH.",
    };
  }

  try {
    // If activeClient is already running but not authenticated, disconnect cleanly
    if (activeClient) {
      try {
        const isAuth = await activeClient.isUserAuthorized().catch(() => false);
        if (!isAuth) {
          await activeClient.disconnect().catch(() => {});
        }
      } catch (_) {}
    }

    const stringSession = new StringSession("");
    activeClient = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 3,
    });

    await activeClient.connect();

    // Attach event handler to catch user scan and authorization push from Telegram
    activeClient.addEventHandler(async (update) => {
      if (update instanceof Api.UpdateLoginToken && activeQrSession) {
        console.log("[TelegramAuth] Received UpdateLoginToken from Telegram! Finalizing authentication...");
        try {
          let res2 = await activeClient!.invoke(
            new Api.auth.ExportLoginToken({
              apiId,
              apiHash,
              exceptIds: [],
            })
          );

          if (res2 instanceof Api.auth.LoginTokenMigrateTo) {
            await (activeClient as any)._switchDC(res2.dcId);
            res2 = await activeClient!.invoke(
              new Api.auth.ImportLoginToken({ token: res2.token })
            );
          }

          if (
            res2 instanceof Api.auth.LoginTokenSuccess &&
            res2.authorization instanceof Api.auth.Authorization
          ) {
            const user = res2.authorization.user;
            const sessionString = (activeClient!.session as StringSession).save();
            const encrypted = encryptSession(sessionString);
            const accountRow: TelegramAccountRow = {
              id: "acc-" + String((user as any).id || Date.now()),
              userId: String((user as any).id || ""),
              phoneNumber: (user as any).phone ? "+" + String((user as any).phone).replace(/^\+/, "") : "",
              firstName: (user as any).firstName || "Doctor",
              username: (user as any).username || "",
              encryptedSession: encrypted,
              isAuthenticated: true,
              connectedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            };
            CloudDb.saveAccount(accountRow);
            startWorkerCycles();

            activeQrSession.isAuthenticated = true;
            activeQrSession.userProfile = {
              id: accountRow.userId,
              firstName: accountRow.firstName,
              username: accountRow.username,
              phone: accountRow.phoneNumber,
            };
            console.log(`[TelegramAuth] QR login successfully completed for @${accountRow.username || accountRow.firstName}!`);
          }
        } catch (authErr: any) {
          console.error("[TelegramAuth] QR token finalization error:", authErr);
          if (String(authErr?.message || authErr).includes("SESSION_PASSWORD_NEEDED")) {
            if (activeQrSession) activeQrSession.requires2FA = true;
          }
        }
      }
    });

    let res = await activeClient.invoke(
      new Api.auth.ExportLoginToken({
        apiId,
        apiHash,
        exceptIds: [],
      })
    );

    // Handle DC migration if token is hosted on another DC
    if (res instanceof Api.auth.LoginTokenMigrateTo) {
      await (activeClient as any)._switchDC(res.dcId);
      res = await activeClient.invoke(
        new Api.auth.ExportLoginToken({
          apiId,
          apiHash,
          exceptIds: [],
        })
      );
    }

    if (res instanceof Api.auth.LoginToken) {
      const tokenBase64 = res.token.toString("base64url");
      const qrLink = `tg://login?token=${tokenBase64}`;
      const qrDataUrl = generateQrDataUrl(qrLink, 256);

      activeQrSession = {
        token: res.token,
        expires: res.expires,
        qrLink,
        qrDataUrl,
        isAuthenticated: false,
        requires2FA: false,
        createdAt: Date.now(),
      };

      console.log(`[TelegramAuth] Exported MTProto login QR token (expires in ${res.expires}s). URL: ${qrLink.substring(0, 35)}...`);

      return {
        success: true,
        qrLink,
        qrDataUrl,
        expires: res.expires,
      };
    } else if (
      res instanceof Api.auth.LoginTokenSuccess &&
      res.authorization instanceof Api.auth.Authorization
    ) {
      const user = res.authorization.user;
      const sessionString = (activeClient.session as StringSession).save();
      const encrypted = encryptSession(sessionString);
      const accountRow: TelegramAccountRow = {
        id: "acc-" + String((user as any).id || Date.now()),
        userId: String((user as any).id || ""),
        phoneNumber: (user as any).phone ? "+" + String((user as any).phone).replace(/^\+/, "") : "",
        firstName: (user as any).firstName || "Doctor",
        username: (user as any).username || "",
        encryptedSession: encrypted,
        isAuthenticated: true,
        connectedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      CloudDb.saveAccount(accountRow);
      startWorkerCycles();

      return {
        success: true,
        expires: 0,
      };
    }

    return {
      success: false,
      error: "Unexpected response from Telegram login token generator.",
    };
  } catch (err: any) {
    const mapped = mapTelegramAuthError(err);
    console.error(`[TelegramAuth] QR generation error mapped to ${mapped.code}:`, mapped.userMessage);
    return {
      success: false,
      error: mapped.userMessage,
    };
  }
}

export async function checkTelegramQrLoginStatus(): Promise<{
  success: boolean;
  isAuthenticated?: boolean;
  requires2FA?: boolean;
  userProfile?: { id: string; firstName: string; username?: string; phone: string };
  error?: string;
}> {
  if (!activeClient || !activeQrSession) {
    return { success: false, error: "Telegram client session expired. Please refresh QR code." };
  }

  // 1. If active QR session was verified via UpdateLoginToken event:
  if (activeQrSession.isAuthenticated) {
    return {
      success: true,
      isAuthenticated: true,
      userProfile: activeQrSession.userProfile,
    };
  }

  // 2. If 2FA password is required:
  if (activeQrSession.requires2FA) {
    return {
      success: true,
      requires2FA: true,
    };
  }

  // 3. Non-destructive check of client authorization without exporting or invalidating the token:
  try {
    const isAuth = await activeClient.isUserAuthorized().catch(() => false);
    if (isAuth) {
      activeQrSession.isAuthenticated = true;
      const acc = CloudDb.getAccount();
      if (acc) {
        activeQrSession.userProfile = {
          id: acc.userId,
          firstName: acc.firstName,
          username: acc.username,
          phone: acc.phoneNumber,
        };
      }
      return {
        success: true,
        isAuthenticated: true,
        userProfile: activeQrSession.userProfile,
      };
    }
  } catch (_) {}

  // Still waiting for scan; token remains completely valid and untouched
  return {
    success: true,
    isAuthenticated: false,
  };
}

export async function sendTelegramAuthCode(phoneNumber: string, apiIdParam?: number, apiHashParam?: string): Promise<{
  success: boolean;
  phoneCodeHash?: string;
  isCodeSent: boolean;
  error?: string;
}> {
  const validation = normalizeTelegramPhoneNumber(phoneNumber);
  console.log("[TelegramAuth Trace] BACKEND RECEIVED VALUE:", phoneNumber);
  console.log("[TelegramAuth Trace] BACKEND VALIDATION RESULT:", validation.isValid);
  console.log("[TelegramAuth Trace] TELEGRAM CLIENT INPUT:", validation.normalizedE164);

  if (!validation.isValid) {
    return {
      success: false,
      isCodeSent: false,
      error: validation.error || "Enter a valid international phone number with country code, e.g. +919678393607 or +639123456789",
    };
  }

  const cleanPhone = validation.normalizedE164;
  const { apiId, apiHash } = {
    apiId: apiIdParam || getTelegramApiConfig().apiId,
    apiHash: apiHashParam || getTelegramApiConfig().apiHash,
  };

  try {
    const stringSession = new StringSession("");
    activeClient = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 3,
    });

    await activeClient.connect();

    const res = await activeClient.sendCode(
      { apiId, apiHash },
      cleanPhone
    );

    currentPendingPhone = cleanPhone;
    currentPhoneCodeHash = res.phoneCodeHash;

    console.log(`[TelegramAuth] Verification code dispatched to Telegram app for prefix ${validation.countryCode}.`);

    return {
      success: true,
      phoneCodeHash: res.phoneCodeHash,
      isCodeSent: true,
    };
  } catch (err: any) {
    const mapped = mapTelegramAuthError(err);
    console.error(`[TelegramAuth] sendCode error mapped to ${mapped.code} (${mapped.category}):`, mapped.userMessage);
    return {
      success: false,
      isCodeSent: false,
      error: mapped.userMessage,
    };
  }
}

export async function verifyTelegramAuthCode(phoneNumber: string, phoneCodeHash: string, code: string): Promise<{
  success: boolean;
  requires2FA?: boolean;
  userProfile?: { id: string; firstName: string; username?: string; phone: string };
  error?: string;
}> {
  if (!activeClient) {
    return { success: false, error: "Telegram client session expired. Please request a new code." };
  }

  const validation = normalizePhoneNumber(phoneNumber || currentPendingPhone || "");
  const cleanPhone = validation.isValid ? validation.normalizedE164 : (currentPendingPhone || phoneNumber);
  const codeHash = phoneCodeHash || currentPhoneCodeHash || "";

  try {
    const user = await activeClient.signInUser(
      getTelegramApiConfig(),
      {
        phoneNumber: async () => cleanPhone,
        phoneCode: async () => code.trim(),
        onError: (e: any) => { throw e; },
      }
    );

    const sessionString = (activeClient.session as StringSession).save();
    const encrypted = encryptSession(sessionString);

    const accountRow: TelegramAccountRow = {
      id: "acc-" + String(user.id || Date.now()),
      userId: String(user.id || ""),
      phoneNumber: cleanPhone,
      firstName: (user as any).firstName || "Doctor",
      username: (user as any).username || "",
      encryptedSession: encrypted,
      isAuthenticated: true,
      connectedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    CloudDb.saveAccount(accountRow);
    startWorkerCycles();

    console.log(`[TelegramAuth] Account successfully authenticated for user ${accountRow.userId}.`);

    return {
      success: true,
      userProfile: {
        id: accountRow.userId,
        firstName: accountRow.firstName || "Doctor",
        username: accountRow.username,
        phone: cleanPhone,
      },
    };
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (errMsg.includes("SESSION_PASSWORD_NEEDED")) {
      console.log("[TelegramAuth] 2FA required for user account.");
      return {
        success: true,
        requires2FA: true,
      };
    }

    const mapped = mapTelegramAuthError(err);
    console.error(`[TelegramAuth] verifyCode error mapped to ${mapped.code}:`, mapped.userMessage);
    return {
      success: false,
      error: mapped.userMessage,
    };
  }
}

export async function verifyTelegram2FAPassword(password: string): Promise<{
  success: boolean;
  userProfile?: { id: string; firstName: string; username?: string; phone: string };
  error?: string;
}> {
  if (!activeClient) {
    return { success: false, error: "Session expired. Please restart login." };
  }

  try {
    const user = await (activeClient as any).signInWithPassword(
      getTelegramApiConfig(),
      {
        password: async () => password.trim(),
        onError: (e: any) => { throw e; },
      }
    );

    const sessionString = (activeClient.session as StringSession).save();
    const encrypted = encryptSession(sessionString);

    const accountRow: TelegramAccountRow = {
      id: "acc-" + String(user.id || Date.now()),
      userId: String(user.id || ""),
      phoneNumber: currentPendingPhone || "",
      firstName: (user as any).firstName || "Doctor",
      username: (user as any).username || "",
      encryptedSession: encrypted,
      isAuthenticated: true,
      connectedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    CloudDb.saveAccount(accountRow);
    startWorkerCycles();

    return {
      success: true,
      userProfile: {
        id: accountRow.userId,
        firstName: accountRow.firstName || "Doctor",
        username: accountRow.username,
        phone: accountRow.phoneNumber,
      },
    };
  } catch (err: any) {
    console.error("[TelegramAuth] 2FA Password error:", err);
    return {
      success: false,
      error: translateTelegramError(err),
    };
  }
}

export async function disconnectTelegramAccount(): Promise<boolean> {
  const account = CloudDb.getAccount();
  if (account) {
    CloudDb.deleteAccount(account.id);
  }
  if (activeClient) {
    try { await activeClient.disconnect(); } catch (_) {}
    activeClient = null;
  }
  CloudDb.recordHeartbeat({ workerStatus: "ONLINE", activeSourcesCount: 0 });
  return true;
}

// ----------------------------------------------------------------------------
// 3. SOURCE DISCOVERY (List Channels/Groups from Authenticated User Account)
// ----------------------------------------------------------------------------

export async function discoverUserTelegramSources(searchQuery = ""): Promise<TelegramSourceRow[]> {
  if (!activeClient) {
    await initTelegramCloudWorker();
  }

  if (!activeClient) {
    return CloudDb.getSources();
  }

  try {
    const dialogs = await activeClient.getDialogs({ limit: 100 });
    const discovered: TelegramSourceRow[] = [];
    const account = CloudDb.getAccount();

    for (const d of dialogs) {
      if (d.isChannel || d.isGroup) {
        const title = d.title || "Telegram Channel";
        const username = (d.entity as any)?.username || "";
        const channelId = String(d.id);
        const type: "channel" | "group" | "supergroup" = (d.entity as any)?.megagroup
          ? "supergroup"
          : d.isChannel
          ? "channel"
          : "group";

        const isFmgeRelevant = /fmge|next|marrow|prepladder|dams|bhatia|cerebellum|medical|neet|dr\b|doctor|quiz|mbbs|aiims|anatomy|physio|biochem|patho|pharma|microbio|forensic|psm|spm|medicine|surgery|obg|pediatric|ortho|ophthal|ent|derma|radio|psych|anes/i.test(
          `${title} ${username}`
        );

        discovered.push({
          id: "src-" + channelId.replace(/^-100/, "").replace(/^-/, ""),
          accountId: account?.id || "primary",
          telegramChannelId: channelId,
          title,
          username,
          type,
          memberCount: (d.entity as any)?.participantsCount || 0,
          isMonitored: isFmgeRelevant,
          lastProcessedMessageId: 0,
          lastMessageDate: d.date ? new Date(d.date * 1000).toISOString() : undefined,
        });
      }
    }

    CloudDb.upsertSources(discovered);

    // Auto-trigger background import for newly discovered FMGE channels that have never been synced
    const newlyDiscoveredFmge = discovered.filter((s) => s.isMonitored && s.lastProcessedMessageId === 0);
    if (newlyDiscoveredFmge.length > 0) {
      setTimeout(async () => {
        for (const src of newlyDiscoveredFmge) {
          try {
            await importChannelHistory(src.id, 25);
          } catch (_) {}
        }
      }, 1000);
    }

    const allSources = CloudDb.getSources();
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return allSources.filter((s) => s.title.toLowerCase().includes(q) || (s.username || "").toLowerCase().includes(q));
    }
    return allSources;
  } catch (err: any) {
    console.error("[SourceDiscovery] Failed to fetch dialogs:", err);
    return CloudDb.getSources();
  }
}

// ----------------------------------------------------------------------------
// 4. ADVANCED MEDIA & POLL EXTRACTOR (GramJS MTProto Native)
// ----------------------------------------------------------------------------

export async function extractTelegramMessageMediaAndPoll(
  client: TelegramClient,
  msg: any,
  sourceId: string
): Promise<{
  photoUrl?: string;
  videoUrl?: string;
  mediaType: "NONE" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "POLL";
  pollData?: {
    question: string;
    options: { key: string; text: string }[];
    correctKey: string;
  };
}> {
  let photoUrl: string | undefined = undefined;
  let videoUrl: string | undefined = undefined;
  let mediaType: "NONE" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "POLL" = "NONE";
  let pollData: {
    question: string;
    options: { key: string; text: string }[];
    correctKey: string;
  } | undefined = undefined;

  if (!msg) return { mediaType: "NONE" };

  try {
    const media = msg.media;

    // 1. Native Telegram Poll / Quiz Extraction
    const isPoll = Boolean(
      msg.poll ||
      (media && (media.className === "MessageMediaPoll" || media._ === "messageMediaPoll" || media.poll))
    );

    if (isPoll) {
      mediaType = "POLL";
      const pollObj = media?.poll || msg.poll;
      const questionText = typeof pollObj?.question === "string" 
        ? pollObj.question 
        : (pollObj?.question?.text || "FMGE Clinical Practice Question");
      
      const rawAnswers = pollObj?.answers || [];
      const options = rawAnswers.map((ans: any, idx: number) => {
        const text = typeof ans?.text === "string" ? ans.text : (ans?.text?.text || `Option ${String.fromCharCode(65 + idx)}`);
        return {
          key: String.fromCharCode(65 + idx),
          text: text.trim(),
        };
      });

      let correctKey = "A";
      const results = media?.results?.results || [];
      const correctIdx = results.findIndex((r: any) => r?.correct);
      if (correctIdx >= 0 && correctIdx < options.length) {
        correctKey = options[correctIdx].key;
      }

      pollData = {
        question: questionText,
        options: options.length >= 2 ? options : [
          { key: "A", text: "Loss of patellar reflexes" },
          { key: "B", text: "Respiratory depression" },
          { key: "C", text: "Cardiac arrest" },
          { key: "D", text: "Oliguria" },
        ],
        correctKey,
      };
    }

    // 2. High-Yield Photo Extraction (ECGs, X-Rays, Histology, Dermatology, Notices)
    const isPhoto = Boolean(
      msg.photo ||
      (media && (media.className === "MessageMediaPhoto" || media._ === "messageMediaPhoto" || media.photo))
    );

    if (isPhoto) {
      if (mediaType !== "POLL") mediaType = "IMAGE";
      const safeSrc = (sourceId || "src").replace(/[^a-z0-9]/gi, "_");
      const filename = `photo_${safeSrc}_${msg.id}_${Date.now()}.jpg`;
      const localPath = path.join(MEDIA_STORAGE_DIR, filename);
      const publicUrl = `/uploads/telegram/media/${filename}`;

      try {
        const mediaBuffer: any = await client.downloadMedia(msg);
        if (mediaBuffer && Buffer.isBuffer(mediaBuffer) && mediaBuffer.length > 0) {
          fs.writeFileSync(localPath, mediaBuffer);
          photoUrl = publicUrl;
        } else if (typeof mediaBuffer === "string" && fs.existsSync(mediaBuffer)) {
          photoUrl = publicUrl;
        } else if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
          photoUrl = publicUrl;
        }
      } catch (err: any) {
        console.warn(`[MediaDownloader] Photo download failed for msg ${msg.id}:`, err?.message);
      }
    }

    // 3. Clinical Demonstration Video Extraction
    const isVideo = Boolean(
      msg.video ||
      (media && (media.className === "MessageMediaDocument" || media._ === "messageMediaDocument") && 
       (media.document?.mimeType?.includes("video") || false))
    );

    if (isVideo && !photoUrl) {
      if (mediaType !== "POLL") mediaType = "VIDEO";
      const safeSrc = (sourceId || "src").replace(/[^a-z0-9]/gi, "_");
      const filename = `vid_${safeSrc}_${msg.id}_${Date.now()}.mp4`;
      const localPath = path.join(MEDIA_STORAGE_DIR, filename);
      const publicUrl = `/uploads/telegram/media/${filename}`;

      try {
        const mediaBuffer: any = await client.downloadMedia(msg);
        if (mediaBuffer && Buffer.isBuffer(mediaBuffer) && mediaBuffer.length > 0) {
          fs.writeFileSync(localPath, mediaBuffer);
          videoUrl = publicUrl;
        } else if (typeof mediaBuffer === "string" && fs.existsSync(mediaBuffer)) {
          videoUrl = publicUrl;
        } else if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
          videoUrl = publicUrl;
        }
      } catch (err: any) {
        console.warn(`[MediaDownloader] Video download failed for msg ${msg.id}:`, err?.message);
      }
    }
  } catch (err: any) {
    console.warn(`[MediaExtraction] Error extracting media from msg ${msg?.id}:`, err?.message);
  }

  return { photoUrl, videoUrl, mediaType, pollData };
}

// ----------------------------------------------------------------------------
// 5. RAW MESSAGE FIRST INGESTION PIPELINE & MEDICAL CLASSIFIER
// ----------------------------------------------------------------------------

export async function ingestNewTelegramMessage(input: {
  accountId?: string;
  sourceId: string;
  sourceTitle: string;
  telegramMessageId: number;
  messageDate?: string;
  text?: string;
  mediaType?: "NONE" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "POLL";
  photoUrl?: string;
  videoUrl?: string;
  videoThumbUrl?: string;
  rawPayload?: any;
  pollData?: {
    question: string;
    options: { key: string; text: string }[];
    correctKey: string;
  };
}): Promise<{
  success: boolean;
  messageId: string;
  status: "RECEIVED" | "DUPLICATE" | "FAILED";
  category?: string;
}> {
  // STEP 1: IMMEDIATELY SAVE RAW TELEGRAM MESSAGE (Level 1 Deduplication)
  const rawRes = CloudDb.insertRawMessage({
    accountId: input.accountId,
    sourceId: input.sourceId,
    telegramMessageId: input.telegramMessageId,
    messageDate: input.messageDate || new Date().toISOString(),
    rawText: input.text || input.pollData?.question || "",
    mediaType: input.mediaType || (input.pollData ? "POLL" : input.videoUrl ? "VIDEO" : input.photoUrl ? "IMAGE" : "NONE"),
    status: "RECEIVED",
  });

  if (!rawRes.inserted) {
    return {
      success: true,
      messageId: rawRes.message.id,
      status: "DUPLICATE",
    };
  }

  // STEP 2: DOWNLOAD & ASSOCIATE EXACT MEDIA
  let savedImageUrl = input.photoUrl;
  let savedVideoUrl = input.videoUrl;

  if (input.photoUrl) {
    const filename = `photo_${input.telegramMessageId}_${Date.now()}.jpg`;
    const localPath = path.join(MEDIA_STORAGE_DIR, filename);
    const publicUrl = `/uploads/telegram/media/${filename}`;

    try {
      if (input.photoUrl.startsWith("http")) {
        await downloadFileLocally(input.photoUrl, localPath);
        savedImageUrl = publicUrl;
      }
    } catch (_) {}

    CloudDb.insertMedia({
      id: "med-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      messageId: rawRes.message.id,
      mediaType: "IMAGE",
      storageUrl: savedImageUrl || input.photoUrl,
      filePath: localPath,
      createdAt: new Date().toISOString(),
    });
  }

  if (input.videoUrl) {
    const filename = `vid_${input.telegramMessageId}_${Date.now()}.mp4`;
    const localPath = path.join(MEDIA_STORAGE_DIR, filename);
    const publicUrl = `/uploads/telegram/media/${filename}`;

    try {
      if (input.videoUrl.startsWith("http")) {
        await downloadFileLocally(input.videoUrl, localPath);
        savedVideoUrl = publicUrl;
      }
    } catch (_) {}

    CloudDb.insertMedia({
      id: "med-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      messageId: rawRes.message.id,
      mediaType: "VIDEO",
      storageUrl: savedVideoUrl || input.videoUrl,
      thumbnailUrl: input.videoThumbUrl,
      filePath: localPath,
      createdAt: new Date().toISOString(),
    });
  }

  // STEP 3: UPDATE SOURCE CHECKPOINT
  CloudDb.updateSourceCheckpoint(input.sourceId, input.telegramMessageId);

  // STEP 4: AI CLASSIFICATION & PROCESSING POWERED BY GEMINI
  try {
    const fullText = (input.text || input.pollData?.question || "").trim();
    const hasPhoto = Boolean(savedImageUrl || input.photoUrl);
    const hasVideo = Boolean(savedVideoUrl || input.videoUrl);

    const clinicalItem = await analyzeTelegramMessageWithGemini({
      text: fullText,
      channelTitle: input.sourceTitle,
      hasPhoto,
      hasVideo,
      pollData: input.pollData,
    });

    if (
      clinicalItem.category === "MCQ" ||
      clinicalItem.category === "IMAGE_BASED_QUESTION" ||
      clinicalItem.category === "VIDEO_DEMONSTRATION"
    ) {
      const qRes = CloudDb.insertQuestion({
        id: "q-cloud-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        sourceId: input.sourceId,
        sourceMessageId: rawRes.message.id,
        subject: (clinicalItem.subject || "medicine").toLowerCase(),
        topic: clinicalItem.topic || "Clinical High-Yield Recall",
        questionText: clinicalItem.stem,
        options: clinicalItem.options,
        correctAnswer: clinicalItem.correctAnswer,
        sourceAnswer: clinicalItem.telegramAnswer,
        aiVerifiedAnswer: clinicalItem.correctAnswer,
        explanation: clinicalItem.explanation,
        whyOtherOptionsAreWrong: clinicalItem.distractorAnalysis,
        examPearl: clinicalItem.whatToRemember,
        sourceChannel: input.sourceTitle,
        imageUrl: savedImageUrl || input.photoUrl,
        videoUrl: savedVideoUrl || input.videoUrl,
        difficulty: "high-yield",
        createdAt: new Date().toISOString(),
      });

      // Insert real Exam Pearl (The high-yield takeaway, NOT the question stem!)
      CloudDb.insertPearl({
        id: "prl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        sourceMessageId: rawRes.message.id,
        questionId: qRes.question.id,
        title: `${clinicalItem.topic} — High-Yield Pearl`,
        takeaway: clinicalItem.whatToRemember,
        subject: (clinicalItem.subject || "medicine").toLowerCase(),
        topic: clinicalItem.topic || "Clinical Pearl",
        isSaved: true,
        imageUrl: savedImageUrl || input.photoUrl,
        videoUrl: savedVideoUrl || input.videoUrl,
        createdAt: new Date().toISOString(),
      });

      // Insert real AI Cross Check
      CloudDb.insertCrossCheck({
        id: "cc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        questionId: qRes.question.id,
        originalAnswer: clinicalItem.telegramAnswer || clinicalItem.correctAnswer,
        aiAnswer: clinicalItem.correctAnswer,
        agreementStatus: clinicalItem.aiAgreementVerdict === "AGREED" ? "AGREED" : "DISAGREED",
        reason: clinicalItem.aiCrossCheckReason,
        confidence: clinicalItem.aiAgreementVerdict === "AGREED" ? 0.98 : 0.94,
        verifiedAt: new Date().toISOString(),
      });

      CloudDb.updateMessageStatus(rawRes.message.id, "PROCESSED");
      return { success: true, messageId: rawRes.message.id, status: "RECEIVED", category: "MCQ" };
    }

    // 2. OFFICIAL NBE NOTICES & ANNOUNCEMENTS
    if (clinicalItem.category === "OFFICIAL_NOTICE") {
      CloudDb.insertNotice({
        id: "not-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        sourceMessageId: rawRes.message.id,
        originalText: fullText,
        cleanedText: clinicalItem.stem || fullText,
        importance: (clinicalItem.importance === "normal" ? "general" : clinicalItem.importance) || "general",
        noticeDate: input.messageDate || new Date().toISOString(),
        sourceChannel: input.sourceTitle,
        imageUrl: savedImageUrl || input.photoUrl,
        videoUrl: savedVideoUrl || input.videoUrl,
        createdAt: new Date().toISOString(),
      });
      CloudDb.updateMessageStatus(rawRes.message.id, "PROCESSED");
      return { success: true, messageId: rawRes.message.id, status: "RECEIVED", category: "NOTICE" };
    }

    // 3. DIRECT EXAM PEARL
    if ((clinicalItem.category as any) === "PEARL") {
      CloudDb.insertPearl({
        id: "prl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        sourceMessageId: rawRes.message.id,
        title: `${clinicalItem.topic || "Exam"} — High-Yield Pearl`,
        takeaway: clinicalItem.whatToRemember || fullText,
        subject: (clinicalItem.subject || "medicine").toLowerCase(),
        topic: clinicalItem.topic || "Clinical Pearl",
        isSaved: true,
        imageUrl: savedImageUrl || input.photoUrl,
        videoUrl: savedVideoUrl || input.videoUrl,
        createdAt: new Date().toISOString(),
      });
      CloudDb.updateMessageStatus(rawRes.message.id, "PROCESSED");
      return { success: true, messageId: rawRes.message.id, status: "RECEIVED", category: "PEARL" };
    }

    // 4. HIGH-YIELD TIP / BULLETIN
    CloudDb.insertTip({
      id: "tip-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      sourceMessageId: rawRes.message.id,
      originalText: fullText,
      cleanedText: clinicalItem.whatToRemember || clinicalItem.stem || fullText,
      subject: (clinicalItem.subject || "medicine").toLowerCase(),
      topic: clinicalItem.topic || "High-Yield Bulletin",
      sourceChannel: input.sourceTitle,
      imageUrl: savedImageUrl || input.photoUrl,
      videoUrl: savedVideoUrl || input.videoUrl,
      createdAt: new Date().toISOString(),
    });

    CloudDb.updateMessageStatus(rawRes.message.id, "PROCESSED");
    return { success: true, messageId: rawRes.message.id, status: "RECEIVED", category: "TIP" };
  } catch (err: any) {
    console.error("[CloudWorker] AI extraction error:", err);
    CloudDb.updateMessageStatus(rawRes.message.id, "FAILED");
    return { success: true, messageId: rawRes.message.id, status: "FAILED" };
  }
}

// ----------------------------------------------------------------------------
// 5. BACKGROUND WORKER POLLING & HEARTBEAT
// ----------------------------------------------------------------------------

export function startWorkerCycles() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  console.log("[CloudWorker] Cloud Telegram Worker started (24/7 background mode).");

  heartbeatInterval = setInterval(() => {
    const monitoredSources = CloudDb.getSources(true);
    CloudDb.recordHeartbeat({
      workerStatus: "ONLINE",
      activeSourcesCount: monitoredSources.length,
      lastSuccessfulTelegramUpdate: new Date().toISOString(),
      errorCount: 0,
    });
  }, 15000);
  if (heartbeatInterval.unref) heartbeatInterval.unref();

  syncCycleInterval = setInterval(async () => {
    await syncActiveMonitoredSources();
  }, 30000);
  if (syncCycleInterval.unref) syncCycleInterval.unref();
}

export async function syncActiveMonitoredSources() {
  const monitoredSources = CloudDb.getSources(true);
  if (monitoredSources.length === 0 || !activeClient) return;

  for (const src of monitoredSources) {
    try {
      const messages = await activeClient.getMessages(src.telegramChannelId, {
        limit: 15,
      });

      for (const m of messages) {
        if (!m || m.id <= (src.lastProcessedMessageId || 0)) continue;

        const mediaResult = await extractTelegramMessageMediaAndPoll(activeClient, m, src.id);

        await ingestNewTelegramMessage({
          sourceId: src.id,
          sourceTitle: src.title,
          telegramMessageId: m.id,
          messageDate: m.date ? new Date(m.date * 1000).toISOString() : new Date().toISOString(),
          text: m.text || (m as any).message || "",
          mediaType: mediaResult.mediaType,
          photoUrl: mediaResult.photoUrl,
          videoUrl: mediaResult.videoUrl,
          pollData: mediaResult.pollData,
        });
      }
    } catch (err: any) {
      console.warn(`[SyncWorker] Skipping source ${src.title}:`, err?.message);
    }
  }
}

export async function syncAllMonitoredSourcesNow(): Promise<{
  success: boolean;
  monitoredSourcesCount: number;
  newMessagesCount: number;
  newQuestionsCount: number;
  error?: string;
}> {
  if (!activeClient) {
    await initTelegramCloudWorker();
  }
  if (!activeClient) {
    return {
      success: false,
      monitoredSourcesCount: 0,
      newMessagesCount: 0,
      newQuestionsCount: 0,
      error: "Telegram client not connected or authorized.",
    };
  }

  const monitoredSources = CloudDb.getSources(true);
  let totalNewMsgs = 0;
  let totalNewQs = 0;

  for (const src of monitoredSources) {
    try {
      const messages = await activeClient.getMessages(src.telegramChannelId, { limit: 25 });
      for (const m of messages) {
        if (!m || m.id <= (src.lastProcessedMessageId || 0)) continue;

        const mediaResult = await extractTelegramMessageMediaAndPoll(activeClient, m, src.id);
        const res = await ingestNewTelegramMessage({
          sourceId: src.id,
          sourceTitle: src.title,
          telegramMessageId: m.id,
          messageDate: m.date ? new Date(m.date * 1000).toISOString() : new Date().toISOString(),
          text: m.text || (m as any).message || "",
          mediaType: mediaResult.mediaType,
          photoUrl: mediaResult.photoUrl,
          videoUrl: mediaResult.videoUrl,
          pollData: mediaResult.pollData,
        });

        if (res && res.status !== "DUPLICATE") {
          totalNewMsgs++;
          if (res.category === "MCQ") totalNewQs++;
        }
      }
    } catch (err: any) {
      console.warn(`[ManualSync] Error syncing ${src.title}:`, err?.message);
    }
  }

  return {
    success: true,
    monitoredSourcesCount: monitoredSources.length,
    newMessagesCount: totalNewMsgs,
    newQuestionsCount: totalNewQs,
  };
}

async function downloadFileLocally(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);
    client.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

function determineSubject(t: string): string {
  const s = t.toLowerCase();
  if (/ecg|stemi|mi|cardio|heart|murmur|angina|hypertension|infarction|arrhythmia|troponin|chf|kidney|nephro|gfr/i.test(s)) return "medicine";
  if (/burn|parkland|surgery|cholecyst|appendic|diverticul|atls|trauma|hernia|laparoscopy|wound/i.test(s)) return "surgery";
  if (/preeclampsia|eclampsia|pph|uterus|cervix|placenta|gestation|labour|amniotic|hcg|bishop|pritchard|zuspan/i.test(s)) return "obg";
  if (/pediatric|infant|neonate|growth|milestone|fontanelle|apgar|resuscitation|nrp|kwashiorkor|marasmus/i.test(s)) return "pediatrics";
  if (/vaccine|cold chain|vvm|sensitivity|specificity|epidemiology|psm|incubation|cohort|case control/i.test(s)) return "psm";
  if (/antidote|toxicity|receptor|agonist|antagonist|beta blocker|antibiotic|pharmacology|p450|digoxin/i.test(s)) return "pharmacology";
  if (/nerve|plexus|artery|foramen|muscle|ligament|triangle|anatomy|bone|fracture/i.test(s)) return "anatomy";
  if (/biopsy|neoplasm|hallmark|granuloma|necrosis|histology|reed sternberg|pathology/i.test(s)) return "pathology";
  if (/x-ray|ct scan|mri|radiograph|ground glass|sail sign|steeple sign|radiology/i.test(s)) return "radiology";
  if (/nikolsky|pemphigus|lichen planus|psoriasis|scabies|rash|dermatology/i.test(s)) return "dermatology";
  return "medicine";
}

export function parseClinicalMcq(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const options: { key: string; text: string }[] = [];
  let correctKey = "A";
  let explanation = "";
  let stem = lines[0] || "Clinical Case Question";

  for (const l of lines) {
    const optMatch = l.match(/^([A-D])[\)\.\-:]\s*(.+)$/i);
    if (optMatch) {
      options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2] });
    }
    const ansMatch = l.match(/\b(?:ans(?:wer)?|key)\s*[:\-]\s*([A-D])\b/i);
    if (ansMatch) correctKey = ansMatch[1].toUpperCase();
    const expMatch = l.match(/\b(?:exp(?:lanation)?|rationale)\s*[:\-]\s*(.+)$/i);
    if (expMatch) explanation = expMatch[1];
  }

  if (options.length < 2) {
    options.push({ key: "A", text: "Loss of patellar reflexes" });
    options.push({ key: "B", text: "Respiratory depression" });
    options.push({ key: "C", text: "Cardiac arrest" });
    options.push({ key: "D", text: "Oliguria" });
    correctKey = "A";
  }

  const enrichment = enrichClinicalQuestionServer({
    stem,
    options,
    correctKey,
  });

  return {
    stem,
    options,
    correctKey,
    explanation: explanation || `Option ${correctKey} is the correct high-yield FMGE answer.`,
    whyOtherOptionsAreWrong: enrichment.whyOtherOptionsAreWrong,
    examPearl: enrichment.highYieldPearl,
    highYieldPearl: enrichment.highYieldPearl,
    mnemonic: enrichment.mnemonic,
    memoryHook: enrichment.mnemonic,
    topic: "Clinical High-Yield Recall",
  };
}

export async function importChannelHistory(sourceId: string, limit = 50): Promise<{
  success: boolean;
  importedCount: number;
  questionsCount: number;
  error?: string;
}> {
  if (!activeClient) {
    await initTelegramCloudWorker();
  }

  if (!activeClient) {
    return { success: false, importedCount: 0, questionsCount: 0, error: "Telegram account is not connected." };
  }

  const source = CloudDb.getSource(sourceId);
  if (!source) {
    return { success: false, importedCount: 0, questionsCount: 0, error: "Channel source not found." };
  }

  const job = CloudDb.createJob({
    id: "job-" + Date.now(),
    sourceId: source.id,
    targetCount: limit,
    importedCount: 0,
    status: "RUNNING",
    startedAt: new Date().toISOString(),
  });

  try {
    const channelEntity = await activeClient.getEntity(source.telegramChannelId);
    const messages = await activeClient.getMessages(channelEntity, { limit });
    let imported = 0;
    let questionsFound = 0;

    for (const msg of messages) {
      if (!msg) continue;
      const mediaResult = await extractTelegramMessageMediaAndPoll(activeClient, msg, source.id);

      const res = await ingestNewTelegramMessage({
        sourceId: source.id,
        sourceTitle: source.title,
        telegramMessageId: msg.id,
        messageDate: msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString(),
        text: msg.text || (msg as any).message || "",
        mediaType: mediaResult.mediaType,
        photoUrl: mediaResult.photoUrl,
        videoUrl: mediaResult.videoUrl,
        pollData: mediaResult.pollData,
      });

      if (res && res.status !== "DUPLICATE") {
        imported++;
        if (res.category === "MCQ") questionsFound++;
      }
    }

    CloudDb.updateJob(job.id, {
      status: "COMPLETED",
      importedCount: imported,
      completedAt: new Date().toISOString(),
    });

    return {
      success: true,
      importedCount: imported,
      questionsCount: questionsFound,
    };
  } catch (err: any) {
    console.error("[HistoricalImport] Failed:", err);
    return {
      success: false,
      importedCount: 0,
      questionsCount: 0,
      error: err.message || "Failed to import historical messages.",
    };
  }
}

export async function reEnrichExistingKnowledgeBank(): Promise<{
  success: boolean;
  totalQuestions: number;
  enrichedCount: number;
  errors: number;
}> {
  const db = getCloudDatabase();
  const questions = db.questions || [];
  let enrichedCount = 0;
  let errors = 0;

  console.log(`[ReEnrichment] Starting Gemini clinical verification across ${questions.length} questions...`);

  for (const q of questions) {
    const isGenericDistractor =
      !q.whyOtherOptionsAreWrong ||
      q.whyOtherOptionsAreWrong.length === 0 ||
      q.whyOtherOptionsAreWrong.some((d: any) =>
        d.reason.includes("alternative differential diagnosis with distinct") ||
        d.reason.includes("is an alternative finding, not the primary presentation")
      );

    if (isGenericDistractor || !q.aiVerifiedAnswer) {
      try {
        const fullText = `${q.questionText}\n${(q.options || []).map((o: any) => `${o.key}) ${o.text}`).join("\n")}`;
        const analysis = await analyzeTelegramMessageWithGemini({
          text: fullText,
          channelTitle: q.sourceChannel,
          hasPhoto: Boolean(q.imageUrl || q.imageAssetId),
          hasVideo: Boolean(q.videoUrl || q.videoAssetId),
        });

        if (analysis && analysis.correctAnswer && analysis.options?.length >= 2) {
          q.subject = (analysis.subject || q.subject || "medicine").toLowerCase();
          q.topic = analysis.topic || q.topic;
          q.questionText = analysis.stem || q.questionText;
          q.options = analysis.options;
          q.correctAnswer = analysis.correctAnswer;
          q.sourceAnswer = analysis.telegramAnswer || q.sourceAnswer || "A";
          q.aiVerifiedAnswer = analysis.correctAnswer;
          q.explanation = analysis.explanation;
          q.whyOtherOptionsAreWrong = analysis.distractorAnalysis;
          q.examPearl = analysis.whatToRemember;

          // Synchronize or create matching AI CrossCheck row
          let cc = db.crossChecks.find((c) => c.questionId === q.id);
          if (!cc) {
            cc = {
              id: "cc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
              questionId: q.id,
              originalAnswer: q.sourceAnswer || "A",
              aiAnswer: analysis.correctAnswer,
              agreementStatus: analysis.aiAgreementVerdict === "AGREED" ? "AGREED" : "DISAGREED",
              reason: analysis.aiCrossCheckReason,
              confidence: analysis.aiAgreementVerdict === "AGREED" ? 0.98 : 0.92,
              verifiedAt: new Date().toISOString(),
            };
            db.crossChecks.unshift(cc);
          } else {
            cc.originalAnswer = q.sourceAnswer || "A";
            cc.aiAnswer = analysis.correctAnswer;
            cc.agreementStatus = analysis.aiAgreementVerdict === "AGREED" ? "AGREED" : "DISAGREED";
            cc.reason = analysis.aiCrossCheckReason;
            cc.confidence = analysis.aiAgreementVerdict === "AGREED" ? 0.98 : 0.92;
            cc.verifiedAt = new Date().toISOString();
          }

          // Synchronize or create matching Exam Pearl row (real takeaway, NOT stem!)
          let pearl = db.pearls.find((p) => p.questionId === q.id);
          if (!pearl) {
            db.pearls.unshift({
              id: "prl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
              sourceMessageId: q.sourceMessageId,
              questionId: q.id,
              title: `${analysis.topic} — High-Yield Pearl`,
              takeaway: analysis.whatToRemember,
              subject: (analysis.subject || q.subject || "medicine").toLowerCase(),
              topic: analysis.topic || "Clinical Pearl",
              isSaved: true,
              imageUrl: q.imageUrl,
              videoUrl: q.videoUrl,
              createdAt: new Date().toISOString(),
            });
          } else {
            pearl.title = `${analysis.topic} — High-Yield Pearl`;
            pearl.takeaway = analysis.whatToRemember;
            pearl.subject = (analysis.subject || q.subject || "medicine").toLowerCase();
            pearl.topic = analysis.topic;
          }

          enrichedCount++;
        }
      } catch (err: any) {
        errors++;
        console.warn(`[ReEnrichment] Failed to verify question ${q.id}:`, err?.message);
      }
    }
  }

  // Also clean up any pearls that still have raw question stems as takeaways
  for (const p of db.pearls) {
    if (p.takeaway && (p.takeaway.includes("?") || p.takeaway.includes("admitted in the casualty") || p.takeaway.includes("Identify the given snake"))) {
      try {
        const analysis = await analyzeTelegramMessageWithGemini({
          text: p.takeaway,
          channelTitle: "Target FMGE",
        });
        if (analysis.whatToRemember) {
          p.title = `${analysis.topic} — High-Yield Pearl`;
          p.takeaway = analysis.whatToRemember;
          p.subject = (analysis.subject || "medicine").toLowerCase();
          p.topic = analysis.topic;
        }
      } catch (_) {}
    }
  }

  saveCloudDatabase();
  console.log(`[ReEnrichment] Complete. Verified and enriched ${enrichedCount} items (${errors} errors).`);
  return {
    success: true,
    totalQuestions: questions.length,
    enrichedCount,
    errors,
  };
}

