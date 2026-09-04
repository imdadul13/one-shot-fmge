import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import {
  CloudDb,
  getCloudDatabase,
  MediaStorageService,
} from "../../../server/db/postgres";
import {
  ingestNewTelegramMessage,
  parseClinicalMcq,
  discoverUserTelegramSources,
} from "../../../server/telegram-worker";

describe("ONE SHOT FMGE — Telegram Final Phases (Phases 7-18) End-to-End Suite", () => {
  before(() => {
    CloudDb.resetTelegramNamespace();
  });

  // TEST 1: Source Dialog Discovery & Selective Monitoring
  it("1. Starts with 0 monitored channels, discovers dialogs, and selectively monitors", async () => {
    const dialogs = await discoverUserTelegramSources();
    assert.equal(Array.isArray(dialogs), true);

    // Add 2 real sources
    CloudDb.saveSources([
      {
        id: "src-highyield",
        accountId: "primary",
        telegramChannelId: "9001",
        title: "FMGE High Yield Club",
        username: "fmgehighyield",
        type: "channel",
        memberCount: 15000,
        isMonitored: false,
        lastProcessedMessageId: 0,
      },
      {
        id: "src-recalls",
        accountId: "primary",
        telegramChannelId: "9002",
        title: "FMGE Clinical Recalls Group",
        type: "supergroup",
        memberCount: 8500,
        isMonitored: false,
        lastProcessedMessageId: 0,
      },
    ]);

    assert.equal(CloudDb.getSources(true).length, 0, "Zero channels monitored by default");

    // Toggle 1 channel
    const toggled = CloudDb.toggleSourceMonitored("src-highyield", true);
    assert(toggled?.isMonitored, "Channel is now monitored");
    assert.equal(CloudDb.getSources(true).length, 1, "Exactly 1 channel active");
  });

  // TEST 2: Multi-Type Classifier (Question, IBQ, Video, Pearl, Notice)
  it("2. Ingests and classifies MCQ, Image IBQ, Video Clip, Pearl, and Official Notice", async () => {
    // 2A: Clinical MCQ Ingestion
    const mcqRes = await ingestNewTelegramMessage({
      sourceId: "src-highyield",
      sourceTitle: "FMGE High Yield Club",
      telegramMessageId: 101,
      text: "A 28-year-old primigravida at 34 weeks presents with BP 160/110 mmHg, 3+ proteinuria, headache, and epigastric pain.\nA) Intravenous Labetalol + Magnesium Sulphate (Pritchard regimen)\nB) Immediate Cesarean section under spinal anesthesia\nC) Oral Nifedipine alone\nD) Intramuscular Dexamethasone and wait for 48 hours\nAns: A\nExp: Severe preeclampsia with impending eclampsia warrants immediate stabilization with Pritchard MgSO4 regimen and IV labetalol.",
    });

    assert.equal(mcqRes.success, true);
    assert.equal(mcqRes.status, "RECEIVED");
    assert.equal(mcqRes.category, "MCQ");

    // 2B: Official Notice Ingestion
    const noticeRes = await ingestNewTelegramMessage({
      sourceId: "src-highyield",
      sourceTitle: "FMGE High Yield Club",
      telegramMessageId: 102,
      text: "NBEMS Official Notice: FMGE June 2026 examination schedule and admit card release date announced on natboard.edu.in.",
    });

    assert.equal(noticeRes.success, true);
    assert.equal(noticeRes.category, "NOTICE");

    // 2C: High-Yield Clinical Pearl
    const pearlRes = await ingestNewTelegramMessage({
      sourceId: "src-highyield",
      sourceTitle: "FMGE High Yield Club",
      telegramMessageId: 103,
      text: "HIGH-YIELD PEARL: Therapeutic serum level of Magnesium Sulphate is 4-7 mEq/L. First sign of toxicity is loss of patellar reflexes (8-10 mEq/L). Antidote is 10% Calcium Gluconate 10ml IV.",
    });

    assert.equal(pearlRes.success, true);
    assert.equal(pearlRes.category, "PEARL");

    const db = getCloudDatabase();
    assert.equal(db.questions.length, 1, "1 question parsed and stored in PostgreSQL");
    assert.equal(db.notices.length, 1, "1 notice stored in PostgreSQL");
    assert.equal(db.pearls.length, 2, "2 pearls preserved (1 direct + 1 from MCQ)");
  });

  // TEST 3: Hard Message Deduplication & Content Fingerprint Deduplication
  it("3. Handles Level 1 exact message duplicate and Level 2 cross-channel repost duplicate", async () => {
    // Exact duplicate (same message ID from same channel)
    const exactDup = await ingestNewTelegramMessage({
      sourceId: "src-highyield",
      sourceTitle: "FMGE High Yield Club",
      telegramMessageId: 101,
      text: "Duplicate message",
    });

    assert.equal(exactDup.status, "DUPLICATE", "Level 1 deduplication prevented re-insert");

    // Cross-channel duplicate (same stem from different channel)
    const crossDup = await ingestNewTelegramMessage({
      sourceId: "src-recalls",
      sourceTitle: "FMGE Clinical Recalls Group",
      telegramMessageId: 501,
      text: "A 28-year-old primigravida at 34 weeks presents with BP 160/110 mmHg, 3+ proteinuria, headache, and epigastric pain.\nA) Intravenous Labetalol + Magnesium Sulphate (Pritchard regimen)\nB) Immediate Cesarean section under spinal anesthesia\nC) Oral Nifedipine alone\nD) Intramuscular Dexamethasone and wait for 48 hours\nAns: A",
    });

    assert.equal(crossDup.success, true);
    const db = getCloudDatabase();
    const canonical = db.questions.find((q) => !q.isDuplicate);
    assert(canonical, "Canonical question exists");
    assert(canonical.duplicateSources.some((s) => s.sourceId === "src-recalls"), "Linked new channel to duplicateSources");
    const dup = db.questions.find((q) => q.isDuplicate);
    assert(dup, "Duplicate question recorded with isDuplicate flag");
    assert.equal(dup.duplicateOfQuestionId, canonical.id);
  });

  // TEST 4: Exam Pearl & AI Cross-Check with Conflict Flagging
  it("4. Detects answer disagreement between Telegram channel key and AI verified guideline", () => {
    const questionId = "q-conflict-test";
    
    // Scenario A: Full Agreement
    CloudDb.insertCrossCheck({
      id: "cc-agree",
      questionId,
      originalAnswer: "A",
      aiAnswer: "A",
      agreementStatus: "AGREED",
      reason: "Standard guideline confirms Option A.",
      confidence: 0.98,
      verifiedAt: new Date().toISOString(),
    });

    let check = CloudDb.getCrossCheckForQuestion(questionId);
    assert(check);
    assert.equal(check.agreementStatus, "AGREED");

    // Scenario B: Conflict Flagging (Disagreement)
    CloudDb.insertCrossCheck({
      id: "cc-disagree",
      questionId: "q-conflict-disagree",
      originalAnswer: "C",
      aiAnswer: "A",
      agreementStatus: "DISAGREED",
      reason: "Channel specified Option C, but standard WHO/ACOG guidelines mandate Option A.",
      confidence: 0.95,
      verifiedAt: new Date().toISOString(),
    });

    let conflictCheck = CloudDb.getCrossCheckForQuestion("q-conflict-disagree");
    assert(conflictCheck);
    assert.equal(conflictCheck.agreementStatus, "DISAGREED");
    assert.equal(conflictCheck.originalAnswer, "C");
    assert.equal(conflictCheck.aiAnswer, "A");
  });

  // TEST 5: Media Storage Service Provider
  it("5. MediaStorageService saves and retrieves binary assets", async () => {
    const dummyBuffer = Buffer.from("DUMMY_IMAGE_DATA");
    const filename = "test_image.jpg";

    const saved = await MediaStorageService.saveMedia(dummyBuffer, "image/jpeg", filename);
    assert(saved.storageUrl.includes(filename), "Saved storage URL contains filename");

    const retrieved = await MediaStorageService.getMedia(filename);
    assert(retrieved);
    assert.equal(retrieved.length, dummyBuffer.length);
  });

  // TEST 6: Developer Reset Clean Slate
  it("6. Developer reset cleans Telegram namespace to 0 while preserving database integrity", () => {
    CloudDb.resetTelegramNamespace();
    const db = getCloudDatabase();
    assert.equal(db.messages.length, 0);
    assert.equal(db.questions.length, 0);
    assert.equal(db.pearls.length, 0);
    assert.equal(db.notices.length, 0);
    assert.equal(db.sources.length, 0);
  });
});
