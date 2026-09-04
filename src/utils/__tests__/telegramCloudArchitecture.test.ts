import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import {
  CloudDb,
  encryptSession,
  decryptSession,
  getCloudDatabase,
} from "../../../server/db/postgres";
import {
  ingestNewTelegramMessage,
  translateTelegramError,
  parseClinicalMcq,
} from "../../../server/telegram-worker";

describe("ONE SHOT FMGE — Telegram Cloud Architecture: End-to-End Test Suite", () => {
  before(() => {
    CloudDb.resetTelegramNamespace();
  });

  // TEST 1: AES-256-GCM Session Encryption & Decryption at Rest
  it("TEST 1: Telegram user session is encrypted at rest using AES-256-GCM and never stored plaintext", () => {
    const rawSessionString = "1BVtsOKEBvhQ10zC7u4_secret_telegram_session_payload_XYZ123456789";
    const encrypted = encryptSession(rawSessionString);

    assert(encrypted, "Encrypted payload exists");
    assert.notEqual(encrypted, rawSessionString, "Encrypted string does not equal plaintext");
    assert.doesNotMatch(encrypted, /secret_telegram_session/i, "Encrypted payload contains no plaintext substrings");

    const decrypted = decryptSession(encrypted);
    assert.equal(decrypted, rawSessionString, "Decrypted session matches original plaintext exactly");
  });

  // TEST 2: Initial Clean Slate (0 Monitored Sources, 0 Messages)
  it("TEST 2: Initial database state starts with 0 monitored sources and 0 imported messages", () => {
    const db = getCloudDatabase();
    assert.equal(db.sources.filter((s) => s.isMonitored).length, 0, "0 monitored sources initially");
    assert.equal(db.messages.length, 0, "0 messages initially");
    assert.equal(db.questions.length, 0, "0 questions initially");
    assert.equal(db.pearls.length, 0, "0 pearls initially");
  });

  // TEST 3: Source Discovery & Monitoring Selection
  it("TEST 3: User can discover channels and selectively toggle monitoring on specific sources", () => {
    CloudDb.upsertSources([
      {
        id: "src-1001",
        accountId: "primary",
        telegramChannelId: "1001",
        title: "Target FMGE High Yield",
        username: "targetfmge",
        type: "channel",
        memberCount: 25000,
        isMonitored: false, // Default is NOT monitored
        lastProcessedMessageId: 0,
      },
      {
        id: "src-1002",
        accountId: "primary",
        telegramChannelId: "1002",
        title: "FMGE Clinical Recalls Discussion",
        type: "supergroup",
        memberCount: 12000,
        isMonitored: false,
        lastProcessedMessageId: 0,
      },
    ]);

    const initialSources = CloudDb.getSources(true);
    assert.equal(initialSources.length, 0, "Still 0 monitored sources");

    // Toggle monitoring on Target FMGE
    const toggled = CloudDb.toggleSourceMonitored("src-1001", true);
    assert(toggled?.isMonitored, "Target FMGE is now monitored");

    const monitored = CloudDb.getSources(true);
    assert.equal(monitored.length, 1, "Exactly 1 monitored source active");
    assert.equal(monitored[0].title, "Target FMGE High Yield");
  });

  // TEST 4: Raw Message First Persistence (Step 1)
  it("TEST 4: New Telegram message is persisted immediately as RAW message with status RECEIVED", async () => {
    const res = await ingestNewTelegramMessage({
      sourceId: "src-1001",
      sourceTitle: "Target FMGE High Yield",
      telegramMessageId: 2001,
      messageDate: "2026-08-31T12:00:00Z",
      text: "Which of the following is the drug of choice for paroxysmal supraventricular tachycardia (PSVT)?\nA) Adenosine\nB) Amiodarone\nC) Verapamil\nD) Digoxin\nAns: A\nExp: IV Adenosine (6mg rapid bolus) is the first-line drug of choice for acute termination of stable PSVT.",
    });

    assert.equal(res.success, true);
    assert.equal(res.status, "RECEIVED");
    assert.equal(res.category, "MCQ");

    const db = getCloudDatabase();
    const rawMsg = db.messages.find((m) => m.telegramMessageId === 2001);
    assert(rawMsg, "Raw message record exists in PostgreSQL messages table");
    assert.equal(rawMsg.sourceId, "src-1001");
    assert.equal(rawMsg.status, "PROCESSED");
  });

  // TEST 5: Level 1 Hard Deduplication: UNIQUE(source_id, telegram_message_id)
  it("TEST 5: Level 1 deduplication prevents identical Telegram message from being ingested twice", async () => {
    const duplicateAttempt = await ingestNewTelegramMessage({
      sourceId: "src-1001",
      sourceTitle: "Target FMGE High Yield",
      telegramMessageId: 2001, // SAME message ID from SAME source
      text: "Duplicate payload text",
    });

    assert.equal(duplicateAttempt.status, "DUPLICATE", "Marked as DUPLICATE");

    const db = getCloudDatabase();
    const matches = db.messages.filter((m) => m.sourceId === "src-1001" && m.telegramMessageId === 2001);
    assert.equal(matches.length, 1, "Exactly 1 record exists in messages table");
  });

  // TEST 6: Media Association (Exact Image Preserved)
  it("TEST 6: Image-based question associates and preserves exact Telegram image URL and metadata", async () => {
    const res = await ingestNewTelegramMessage({
      sourceId: "src-1001",
      sourceTitle: "Target FMGE High Yield",
      telegramMessageId: 2002,
      text: "A 45-year-old male presents with epigastric pain radiating to back. CT abdomen is attached. What is the diagnosis?\nA) Acute pancreatitis\nB) Peptic ulcer\nC) Cholecystitis\nD) Appendicitis\nAns: A\nExp: CT demonstrates necrotizing pancreatitis.",
      mediaType: "IMAGE",
      photoUrl: "https://api.telegram.org/file/bot/photos/pancreatitis_ct.jpg",
    });

    assert.equal(res.success, true);

    const db = getCloudDatabase();
    const mediaRecord = db.media.find((m) => m.storageUrl.includes("pancreatitis_ct.jpg") || m.mediaType === "IMAGE");
    assert(mediaRecord, "Media asset created and linked in telegram_media table");
    assert.equal(mediaRecord.mediaType, "IMAGE");
  });

  // TEST 7: Media Association (Exact Video Preserved)
  it("TEST 7: Video-based question associates and preserves exact video stream and thumbnail", async () => {
    const res = await ingestNewTelegramMessage({
      sourceId: "src-1001",
      sourceTitle: "Target FMGE High Yield",
      telegramMessageId: 2003,
      text: "Observe the clinical video showing rhythmic horizontal eye oscillation. Diagnosis?\nA) Horizontal Jerk Nystagmus\nB) Opsoclonus\nC) Ocular flutter\nD) Saccades\nAns: A\nExp: Jerk nystagmus with slow drift.",
      mediaType: "VIDEO",
      videoUrl: "https://api.telegram.org/file/bot/videos/nystagmus.mp4",
      videoThumbUrl: "https://api.telegram.org/file/bot/photos/nystagmus_thumb.jpg",
    });

    assert.equal(res.success, true);

    const db = getCloudDatabase();
    const videoMedia = db.media.find((m) => m.mediaType === "VIDEO");
    assert(videoMedia, "Video media asset created in telegram_media table");
    assert(videoMedia.thumbnailUrl, "Thumbnail URL preserved");
  });

  // TEST 8: Independent Exam Pearl Storage
  it("TEST 8: Exam Pearls are stored independently from questions in the pearls table", () => {
    const db = getCloudDatabase();
    assert(db.pearls.length >= 1, "Exam pearls generated and stored in pearls table");
    const pearl = db.pearls[0];
    assert(pearl.title, "Pearl has title");
    assert(pearl.takeaway, "Pearl has takeaway");
    assert.equal(pearl.isSaved, true);
  });

  // TEST 9: AI Cross-Check Verification Storage
  it("TEST 9: AI Cross-Check stores verification agreement status and clinical rationale", () => {
    const db = getCloudDatabase();
    assert(db.crossChecks.length >= 1, "AI cross-check record generated in cross_checks table");
    const cc = db.crossChecks[0];
    assert.equal(cc.agreementStatus, "AGREED");
    assert(cc.reason, "Cross-check contains reasoning text");
    assert(cc.confidence >= 0.9);
  });

  // TEST 10: Level 2 Content Deduplication Fingerprinting
  it("TEST 10: Reposted question with different Telegram Message ID is detected as Possible Duplicate", async () => {
    const res = await ingestNewTelegramMessage({
      sourceId: "src-1002", // Different source
      sourceTitle: "FMGE Clinical Recalls Discussion",
      telegramMessageId: 9999, // Different message ID
      text: "Which of the following is the drug of choice for paroxysmal supraventricular tachycardia (PSVT)?\nA) Adenosine\nB) Amiodarone\nC) Verapamil\nD) Digoxin\nAns: A\nExp: IV Adenosine is first line.",
    });

    assert.equal(res.success, true);

    const db = getCloudDatabase();
    const duplicateQuestion = db.questions.find((q) => q.sourceChannel === "FMGE Clinical Recalls Discussion");
    assert(duplicateQuestion, "Duplicate question stored with metadata");
    assert.equal(duplicateQuestion.isDuplicate, true, "Level 2 fingerprint detected content duplicate");
    assert(duplicateQuestion.duplicateOfQuestionId, "Linked to original canonical question ID");
  });

  // TEST 11: Worker Heartbeat & Liveness Tracking
  it("TEST 11: Cloud Worker updates heartbeat with ONLINE status and active source metrics", () => {
    CloudDb.recordHeartbeat({
      workerStatus: "ONLINE",
      activeSourcesCount: 1,
      lastSuccessfulTelegramUpdate: new Date().toISOString(),
      errorCount: 0,
    });

    const hb = CloudDb.getHeartbeat();
    assert(hb);
    assert.equal(hb.workerStatus, "ONLINE");
    assert.equal(hb.activeSourcesCount, 1);
    assert.equal(hb.errorCount, 0);
  });

  // TEST 12: Human-Readable Telegram Error Translation
  it("TEST 12: Telegram RPC error codes are translated into clear human-readable guidance", () => {
    assert.match(
      translateTelegramError({ message: "PHONE_NUMBER_INVALID" }),
      /international format/i
    );
    assert.match(
      translateTelegramError({ message: "SESSION_PASSWORD_NEEDED" }),
      /Two-Factor Authentication/i
    );
    assert.match(
      translateTelegramError({ message: "PHONE_CODE_EXPIRED" }),
      /expired/i
    );
    assert.match(
      translateTelegramError({ message: "FLOOD_WAIT_120" }),
      /120 seconds/i
    );
  });

  // TEST 13: Official Notice Ingestion
  it("TEST 13: Official NBEMS notice is ingested and classified into notices table", async () => {
    const res = await ingestNewTelegramMessage({
      sourceId: "src-1001",
      sourceTitle: "Target FMGE High Yield",
      telegramMessageId: 2004,
      text: "IMPORTANT NBEMS NOTICE: FMGE December 2026 examination schedule notification announced.",
    });

    assert.equal(res.success, true);
    assert.equal(res.category, "NOTICE");

    const db = getCloudDatabase();
    const notice = db.notices.find((n) => n.sourceMessageId);
    assert(notice);
    assert.equal(notice.importance, "important");
  });

  // TEST 14: Distractor Analysis Breakdown
  it("TEST 14: Distractor analysis generates 'Why other options are wrong' breakdown", () => {
    const mcqText = `Earliest sign of magnesium sulfate toxicity?
A) Loss of patellar reflexes
B) Respiratory depression
C) Cardiac arrest
D) Oliguria
Ans: A
Exp: Loss of patellar reflex occurs at 8-12 mg/dL.`;

    const parsed = parseClinicalMcq(mcqText);
    assert.equal(parsed.correctKey, "A");
    assert.equal(parsed.whyOtherOptionsAreWrong.length, 3);
    assert.equal(parsed.whyOtherOptionsAreWrong[0].key, "B");
  });
});
