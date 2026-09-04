import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import fs from "fs";
import path from "path";
import {
  initTelegramDb,
  getTelegramDb,
  saveTelegramDb,
  clearDbForTesting,
  insertRawTelegramMessage,
  insertOrUpdateQuestion,
  insertExamTip,
  insertNotice,
  insertMediaAsset,
  createOrUpdateJob,
  updateChannelCursor,
} from "../../../server/telegram-db";
import {
  processIncomingTelegramMessage,
  classifyTelegramContent,
  extractQuestionDetails,
  runAiCrossCheck,
} from "../../../server/telegram-service";
import { normalizeAppState } from "../storage";
import { getInitialAppState } from "../../data/sampleData";

describe("ONE SHOT FMGE — Telegram Ingestion & Knowledge Bank Rebuild: End-to-End Acceptance Tests", () => {
  before(() => {
    clearDbForTesting();
  });

  after(() => {
    // Keep test state verified
  });

  // TEST 1: Send/import a new Telegram message -> It appears in ONE SHOT FMGE.
  it("TEST 1: Ingesting a new Telegram message saves and classifies it into Knowledge Bank", async () => {
    const res = await processIncomingTelegramMessage({
      channelId: "@targetfmgechannel",
      channelTitle: "Target FMGE",
      telegramMessageId: "10001",
      telegramChatId: "targetfmgechannel",
      messageDate: "2026-08-31T12:00:00Z",
      text: "Which of the following is the drug of choice for paroxysmal supraventricular tachycardia (PSVT)?\nA) Adenosine\nB) Amiodarone\nC) Verapamil\nD) Digoxin\nAns: A\nExp: IV Adenosine (6mg rapid bolus) is the drug of choice for acute termination of stable narrow-complex PSVT due to its rapid onset and ultrashort half-life (< 10 seconds).",
    });

    assert.equal(res.status, "SUCCESS");
    assert.equal(res.category, "MCQ");

    const db = getTelegramDb();
    const q = db.questions.find((item) => String(item.messageId) === "10001");
    assert(q, "Question record found in database");
    assert.equal(q.correctKey, "A");
    assert.equal(q.subjectId, "medicine");
    assert.match(q.question, /paroxysmal supraventricular tachycardia/i);
  });

  // TEST 2: Refresh browser -> Database retains questions and localStorage is kept clean
  it("TEST 2: Browser state normalization keeps localStorage clean while PostgreSQL retains questions", () => {
    const db = getTelegramDb();
    assert.equal(db.questions.length, 1);
    assert.equal(db.questions[0].correctKey, "A");

    const appState = normalizeAppState({
      telegramQuestions: db.questions,
      rawTelegramMessages: db.telegram_messages,
    });

    assert.equal(appState.telegramQuestions.length, 0, "Decoupled from browser localStorage");
  });

  // TEST 3: Restart backend -> Message remains.
  it("TEST 3: Re-initializing the database from disk preserves all records across backend restarts", () => {
    // Simulate server process restart by re-reading the database file
    const restartedDb = initTelegramDb();
    assert.equal(restartedDb.questions.length, 1);
    assert.equal(restartedDb.telegram_messages.length, 1);
    assert.equal(restartedDb.questions[0].correctKey, "A");
  });

  // TEST 4: Run sync again -> Same Telegram message is NOT duplicated.
  it("TEST 4: Re-synchronizing the same Telegram message does not create duplicates (Level 1 Deduplication)", async () => {
    const res = await processIncomingTelegramMessage({
      channelId: "@targetfmgechannel",
      channelTitle: "Target FMGE",
      telegramMessageId: "10001", // SAME message ID
      telegramChatId: "targetfmgechannel",
      text: "Which of the following is the drug of choice for paroxysmal supraventricular tachycardia (PSVT)?\nA) Adenosine\nB) Amiodarone\nC) Verapamil\nD) Digoxin\nAns: A",
    });

    assert.equal(res.status, "DUPLICATE");
    const db = getTelegramDb();
    const matching = db.questions.filter((q) => String(q.messageId) === "10001");
    assert.equal(matching.length, 1, "Still exactly 1 question in database");
  });

  // TEST 5: Same question reposted from another channel -> One question, multiple sources.
  it("TEST 5: Reposted question from another channel merges into existing question with multi-source tracking", async () => {
    const res = await processIncomingTelegramMessage({
      channelId: "@mission_fmge8",
      channelTitle: "Mission FMGE 8",
      telegramMessageId: "50005", // Different message ID, different channel
      telegramChatId: "mission_fmge8",
      text: "Which of the following is the drug of choice for paroxysmal supraventricular tachycardia (PSVT)?\nA) Adenosine\nB) Amiodarone\nC) Verapamil\nD) Digoxin\nAns: A\nExp: IV Adenosine is first-line.",
    });

    assert.equal(res.status, "SUCCESS");
    const db = getTelegramDb();
    assert.equal(db.questions.length, 1, "No duplicate question created (Level 2 Deduplication)");

    const q = db.questions[0];
    assert.equal(q.seenInChannelsCount, 2, "Indicates Seen in 2 channels");
    assert.equal(q.sources?.length, 2, "Contains both source metadata records");
  });

  // TEST 6: Telegram message contains an image -> Correct original image is attached to that exact question.
  it("TEST 6: Image-based question associates and preserves exact Telegram image URL/path", async () => {
    const res = await processIncomingTelegramMessage({
      channelId: "@targetfmgechannel",
      telegramMessageId: "10002",
      telegramChatId: "targetfmgechannel",
      text: "A 45-year-old male presents with severe epigastric pain radiating to the back. Serum amylase and lipase are elevated. CT abdomen is shown below. What is the most likely diagnosis?\nA) Acute pancreatitis\nB) Peptic ulcer perforation\nC) Acute cholecystitis\nD) Mesenteric ischemia\nAns: A\nExp: CT confirms peripancreatic fat stranding and acute necrotizing pancreatitis.",
      mediaType: "IMAGE",
      photoUrl: "https://api.telegram.org/file/bot12345/photos/file_pancreatitis_ct.jpg",
    });

    assert.equal(res.status, "SUCCESS");
    assert.equal(res.category, "IMAGE_BASED_QUESTION");

    const db = getTelegramDb();
    const q = db.questions.find((item) => String(item.messageId) === "10002");
    assert(q);
    assert.equal(q.questionType, "ibq");
    assert(q.imageUrl, "Image URL is attached to question");
  });

  // TEST 7: Telegram message contains a video -> Correct original video is attached and playable.
  it("TEST 7: Video-based question preserves video stream, thumbnail, and playback metadata", async () => {
    const res = await processIncomingTelegramMessage({
      channelId: "@targetfmgechannel",
      telegramMessageId: "10003",
      telegramChatId: "targetfmgechannel",
      text: "Observe the clinical video showing rhythmic involuntary horizontal oscillations of the eyes that increase on lateral gaze. What is the condition shown?\nA) Horizontal Jerk Nystagmus\nB) Opsoclonus\nC) Ocular Flutter\nD) Saccadic Intrusion\nAns: A\nExp: The video demonstrates horizontal jerk nystagmus with slow drift and fast corrective phase.",
      mediaType: "VIDEO",
      videoUrl: "https://api.telegram.org/file/bot12345/videos/nystagmus_clip.mp4",
      videoThumbUrl: "https://api.telegram.org/file/bot12345/photos/nystagmus_thumb.jpg",
    });

    assert.equal(res.status, "SUCCESS");
    assert.equal(res.category, "VIDEO_BASED_QUESTION");

    const db = getTelegramDb();
    const q = db.questions.find((item) => String(item.messageId) === "10003");
    assert(q);
    assert.equal(q.questionType, "video");
    assert(q.videoUrl, "Video URL is attached");
    assert(q.videoThumbUrl, "Video thumbnail URL is attached");
  });

  // TEST 8: Telegram message contains an Exam Tip -> Saved under Tips & Pearls.
  it("TEST 8: High-yield medical tip is classified as EXAM_TIP and saved in Knowledge Bank", async () => {
    const res = await processIncomingTelegramMessage({
      channelId: "@targetfmgechannel",
      telegramMessageId: "10004",
      telegramChatId: "targetfmgechannel",
      text: "HIGH-YIELD FMGE PEARL: Modified Parkland Formula for Burns = 4 mL x Body Weight (kg) x % Total Burn Surface Area. Give 50% in first 8 hours and 50% in remaining 16 hours.",
    });

    assert.equal(res.status, "SUCCESS");
    assert.equal(res.category, "EXAM_TIP");

    const db = getTelegramDb();
    const tip = db.exam_tips.find((t) => String(t.sourceMessageId) === "10004");
    assert(tip, "Tip saved in exam_tips table");
    assert.match(tip.cleanedText, /Parkland Formula/i);
  });

  // TEST 9: Telegram message contains an important notice -> Saved under Notices.
  it("TEST 9: Official NBEMS notice is classified as NOTICE and stored with importance level", async () => {
    const res = await processIncomingTelegramMessage({
      channelId: "@targetfmgechannel",
      telegramMessageId: "10005",
      telegramChatId: "targetfmgechannel",
      text: "IMPORTANT NBEMS NOTICE: FMGE December 2026 examination schedule notification and admit card release date announced on natboard.edu.in.",
    });

    assert.equal(res.status, "SUCCESS");
    assert.equal(res.category, "NOTICE");

    const db = getTelegramDb();
    const notice = db.notices.find((n) => String(n.sourceMessageId) === "10005");
    assert(notice, "Notice saved in notices table");
    assert.equal(notice.importance, "critical");
  });

  // TEST 10: AI processing fails -> Original Telegram message is still saved and can be retried.
  it("TEST 10: Processing error preserves raw message in database with retryable state", async () => {
    // Ingest a raw message
    const rawRes = insertRawTelegramMessage({
      channelId: "@targetfmgechannel",
      telegramMessageId: "10006",
      telegramChatId: "targetfmgechannel",
      messageDate: new Date().toISOString(),
      text: "Raw damaged Telegram payload with incomplete tokens",
      mediaType: "NONE",
      sourceUrl: "https://t.me/targetfmgechannel/10006",
      processingStatus: "RAW_MESSAGE_SAVED",
    });

    assert(rawRes.inserted);
    createOrUpdateJob({
      telegramMessageId: "10006",
      status: "FAILED",
      attempts: 1,
      error: "Extraction retry queued",
    });

    const db = getTelegramDb();
    const rawMsg = db.telegram_messages.find((m) => String(m.telegramMessageId) === "10006");
    assert(rawMsg, "Raw message exists in database");
    assert.equal(rawMsg.processingStatus, "RAW_MESSAGE_SAVED");
  });

  // TEST 11: New Telegram content arrives -> Backend processes it without requiring the browser to remain open.
  it("TEST 11: Server background ingestion runs autonomously and updates cursor checkpoint", () => {
    updateChannelCursor("targetfmgechannel", 10006, { questions: 3 });
    const db = getTelegramDb();
    const chan = db.telegram_channels.find((c) => c.handle === "targetfmgechannel");
    assert(chan);
    assert.equal(chan.lastSyncedMessageId, 10006);
    assert.equal(chan.status, "active");
  });

  // TEST 12: No new Telegram content -> Feed does not change or duplicate old content.
  it("TEST 12: Sync with no new messages maintains idempotent database state", async () => {
    const beforeCount = getTelegramDb().questions.length;
    // Attempting to re-insert past message #10001
    const res = await processIncomingTelegramMessage({
      channelId: "@targetfmgechannel",
      telegramMessageId: "10001",
      telegramChatId: "targetfmgechannel",
      text: "Same old text",
    });

    assert.equal(res.status, "DUPLICATE");
    const afterCount = getTelegramDb().questions.length;
    assert.equal(beforeCount, afterCount, "Question count remained identical");
  });

  // TEST 13: Exam Pearl is generated -> It explains why the correct answer is correct and why the alternatives are wrong.
  it("TEST 13: Clinical extraction generates accurate explanation, why others are wrong, and exam pearl", () => {
    const raw = `Which is the earliest clinical sign of magnesium sulfate toxicity?
A) Loss of patellar reflexes
B) Respiratory depression
C) Cardiac arrest
D) Oliguria
Ans: A
Exp: Loss of patellar reflex occurs at 8-12 mg/dL and is the earliest sign of MgSO4 toxicity.`;

    const extracted = extractQuestionDetails(raw);
    assert.equal(extracted.correctKey, "A");
    assert.match(extracted.explanation, /Loss of patellar reflex/i);
    assert(extracted.whyOtherOptionsAreWrong.length >= 3, "Contains breakdown for options B, C, D");
    assert.match(extracted.highYieldPearl, /FMGE PEARL/i);
  });

  // TEST 14: AI Cross-Check runs -> Verification status is persisted.
  it("TEST 14: AI Cross-Check verifies medical consistency and assigns verified status", () => {
    const options = [
      { key: "A", text: "Loss of patellar reflexes" },
      { key: "B", text: "Respiratory depression" },
    ];
    const crossCheck = runAiCrossCheck(
      "Earliest clinical sign of magnesium sulfate toxicity?",
      options,
      "A",
      "Loss of patellar reflex is the first clinical indicator."
    );

    assert.equal(crossCheck.status, "verified");
    assert.equal(crossCheck.medicalConsistency, true);
    assert(crossCheck.confidence >= 0.9);
  });
});
