import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import {
  CloudDb,
  getCloudDatabase,
  MediaStorageService,
  encryptSession,
  decryptSession,
  computeFingerprint,
  TelegramMessageRow,
  QuestionRow,
} from "../../../server/db/postgres";

describe("PHASE 2: PostgreSQL Schema Constraints & MediaStorageService Provider Abstraction", () => {
  before(() => {
    CloudDb.resetTelegramNamespace();
  });

  // TEST 1: Session Security with AES-256-GCM
  it("1. AES-256-GCM securely encrypts and decrypts Telegram StringSession", () => {
    const rawSession = "1BapWVyQBu8X9...";
    const encrypted = encryptSession(rawSession);
    assert.notEqual(encrypted, rawSession);
    assert(encrypted.includes(":"), "Includes IV, authTag, and ciphertext separated by colons");

    const decrypted = decryptSession(encrypted);
    assert.equal(decrypted, rawSession, "Decrypted session matches original plain text");
  });

  // TEST 2: MediaStorageService Provider Abstraction
  it("2. MediaStorageService abstracts persistent media storage (save, retrieve, delete)", async () => {
    const dummyBuffer = Buffer.from("DUMMY_IMAGE_DATA_FMGE_RADIOLOGY_SCAN");
    const result = await MediaStorageService.saveMedia(dummyBuffer, "image/jpeg", "test_scan_101.jpg");

    assert(result.storageUrl, "Returns storage URL");
    assert.equal(result.mimeType, "image/jpeg");
    assert.equal(result.sizeBytes, dummyBuffer.length);

    const retrieved = await MediaStorageService.getMedia(result.storageKey);
    assert(retrieved, "Retrieved media buffer");
    assert.equal(retrieved?.toString(), "DUMMY_IMAGE_DATA_FMGE_RADIOLOGY_SCAN");

    const deleted = await MediaStorageService.deleteMedia(result.storageKey);
    assert.equal(deleted, true);
  });

  // TEST 3: Hard Message Deduplication: UNIQUE(account_id, source_id, telegram_message_id)
  it("3. CloudDb enforces hard composite unique identity for messages", () => {
    const msg1: TelegramMessageRow = {
      id: "msg-101",
      accountId: "acc-1",
      sourceId: "src-targetfmge",
      telegramMessageId: 5001,
      messageDate: new Date().toISOString(),
      rawText: "Clinical question text for testing",
      mediaType: "NONE",
      status: "RECEIVED",
      receivedAt: new Date().toISOString(),
    };

    const res1 = CloudDb.insertMessage(msg1);
    assert.equal(res1.action, "INSERTED");

    // Attempt duplicate insert of same account + source + telegram message id
    const resDuplicate = CloudDb.insertMessage(msg1);
    assert.equal(resDuplicate.action, "DUPLICATE");
    assert.equal(resDuplicate.message.id, "msg-101");
  });

  // TEST 4: Durable Message State Lifecycle Tracking
  it("4. Durable Message Processing States transition cleanly through lifecycle", () => {
    CloudDb.updateMessageStatus("msg-101", "CLASSIFYING");
    let dbMsg = getCloudDatabase().messages.find((m) => m.id === "msg-101");
    assert.equal(dbMsg?.status, "CLASSIFYING");

    CloudDb.updateMessageStatus("msg-101", "EXTRACTING");
    dbMsg = getCloudDatabase().messages.find((m) => m.id === "msg-101");
    assert.equal(dbMsg?.status, "EXTRACTING");

    CloudDb.updateMessageStatus("msg-101", "AI_CHECK");
    dbMsg = getCloudDatabase().messages.find((m) => m.id === "msg-101");
    assert.equal(dbMsg?.status, "AI_CHECK");

    CloudDb.updateMessageStatus("msg-101", "PROCESSED");
    dbMsg = getCloudDatabase().messages.find((m) => m.id === "msg-101");
    assert.equal(dbMsg?.status, "PROCESSED");

    // Test failure state with retry count tracking
    CloudDb.updateMessageStatus("msg-101", "FAILED", "Network timeout contacting Telegram DC");
    dbMsg = getCloudDatabase().messages.find((m) => m.id === "msg-101");
    assert.equal(dbMsg?.status, "FAILED");
    assert.equal(dbMsg?.errorMessage, "Network timeout contacting Telegram DC");
    assert.equal(dbMsg?.retryCount, 1);
  });

  // TEST 5: Content Fingerprint & Multi-Channel Cross-Posting Deduplication
  it("5. Content Fingerprint merges cross-channel duplicates into single question record with multiple source references", () => {
    const q1: QuestionRow = {
      id: "q-101",
      accountId: "acc-1",
      sourceId: "src-chan-a",
      sourceMessageId: "1001",
      subject: "medicine",
      topic: "Cardiology - STEMI",
      questionText: "Which coronary artery supplies the inferior wall of left ventricle?",
      options: [
        { key: "A", text: "Right Coronary Artery" },
        { key: "B", text: "Left Anterior Descending" },
        { key: "C", text: "Circumflex Artery" },
        { key: "D", text: "Left Main Artery" },
      ],
      correctAnswer: "A",
      explanation: "RCA supplies the inferior wall in 85% of individuals.",
      whyOtherOptionsAreWrong: [],
      sourceChannel: "@chan_a",
      difficulty: "medium",
      createdAt: new Date().toISOString(),
    };

    const res1 = CloudDb.insertQuestion(q1);
    assert.equal(res1.action, "CREATED");
    assert(res1.question.contentFingerprint, "Fingerprint generated");

    // Same question posted in different channel B
    const q2: QuestionRow = {
      id: "q-102",
      accountId: "acc-1",
      sourceId: "src-chan-b",
      sourceMessageId: "2002",
      subject: "medicine",
      topic: "Cardiology - STEMI",
      questionText: "Which coronary artery supplies the inferior wall of left ventricle?",
      options: [
        { key: "A", text: "Right Coronary Artery" },
        { key: "B", text: "Left Anterior Descending" },
        { key: "C", text: "Circumflex Artery" },
        { key: "D", text: "Left Main Artery" },
      ],
      correctAnswer: "A",
      explanation: "RCA supplies the inferior wall.",
      whyOtherOptionsAreWrong: [],
      sourceChannel: "@chan_b",
      difficulty: "medium",
      createdAt: new Date().toISOString(),
    };

    const res2 = CloudDb.insertQuestion(q2);
    assert.equal(res2.action, "DUPLICATE");
    assert.equal(res2.question.duplicateOfQuestionId, "q-101");

    // Verify channel B is linked as duplicateSource under q-101
    const original = getCloudDatabase().questions.find((q) => q.id === "q-101");
    assert(original?.duplicateSources && original.duplicateSources.length >= 1);
    assert.equal(original?.duplicateSources[0].sourceId, "src-chan-b");
    assert.equal(original?.duplicateSources[0].sourceTitle, "@chan_b");
  });

  // TEST 6: Developer Reset wipes Telegram namespace cleanly
  it("6. resetTelegramNamespace resets all Telegram data cleanly", () => {
    CloudDb.resetTelegramNamespace();
    const db = getCloudDatabase();
    assert.equal(db.messages.length, 0);
    assert.equal(db.questions.length, 0);
    assert.equal(db.accounts.length, 0);
    assert.equal(db.sources.length, 0);
    assert.equal(db.pearls.length, 0);
  });
});
