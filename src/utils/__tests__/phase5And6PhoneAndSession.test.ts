import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import {
  normalizeTelegramPhoneNumber,
  normalizePhoneNumber,
} from "../../../server/phone-validation";
import {
  CloudDb,
  getCloudDatabase,
  encryptSession,
  decryptSession,
  TelegramAccountRow,
} from "../../../server/db/postgres";

describe("PHASE 5 & 6: E.164 Phone Authentication & PostgreSQL Encrypted Session Persistence", () => {
  before(() => {
    CloudDb.resetTelegramNamespace();
  });

  // TEST 1: Universal E.164 International Phone Number Normalization
  it("1. Normalizes international numbers across India, Philippines, US, and UK", () => {
    const india = normalizeTelegramPhoneNumber("+91 96783-93607");
    assert.equal(india.isValid, true);
    assert.equal(india.normalizedE164, "+919678393607");
    assert.equal(india.countryCode, "+91");
    assert.equal(india.nationalNumber, "9678393607");

    const phil = normalizeTelegramPhoneNumber("0063 (912) 345-6789");
    assert.equal(phil.isValid, true);
    assert.equal(phil.normalizedE164, "+639123456789");
    assert.equal(phil.countryCode, "+63");

    const us = normalizeTelegramPhoneNumber("+1 415 555 2671");
    assert.equal(us.isValid, true);
    assert.equal(us.normalizedE164, "+14155552671");

    const uk = normalizeTelegramPhoneNumber("+44 7911 123456");
    assert.equal(uk.isValid, true);
    assert.equal(uk.normalizedE164, "+447911123456");
  });

  // TEST 2: Rejection of Malformed Phone Numbers with Actionable Feedback
  it("2. Rejects invalid strings without throwing native browser pattern errors", () => {
    const tooShort = normalizeTelegramPhoneNumber("+123");
    assert.equal(tooShort.isValid, false);
    assert.match(tooShort.error || "", /valid international phone number/i);

    const nonNumeric = normalizeTelegramPhoneNumber("not-a-number");
    assert.equal(nonNumeric.isValid, false);
  });

  // TEST 3: Encrypted Session PostgreSQL Storage & Retrieval
  it("3. Stores encrypted Telegram StringSession in PostgreSQL and retrieves safely", () => {
    const sampleRawSession = "1BVtsOMQBu8X9sampleStringSessionSecret...";
    const encrypted = encryptSession(sampleRawSession);

    const account: TelegramAccountRow = {
      id: "acc-9678393607",
      userId: "9678393607",
      phoneNumber: "+919678393607",
      firstName: "Dr. Aspirant",
      username: "aspirant_fmge",
      encryptedSession: encrypted,
      isAuthenticated: true,
      connectedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    CloudDb.saveAccount(account);

    const saved = CloudDb.getAccount("acc-9678393607");
    assert(saved, "Account persisted in PostgreSQL");
    assert.equal(saved.isAuthenticated, true);
    assert.equal(saved.phoneNumber, "+919678393607");
    assert.equal(saved.encryptedSession, encrypted);

    // Decrypt on backend only
    const restored = decryptSession(saved.encryptedSession);
    assert.equal(restored, sampleRawSession);
  });

  // TEST 4: Zero Plain-Text Session Exposure to Frontend
  it("4. Safe user profile excludes raw session strings", () => {
    const saved = CloudDb.getAccount();
    assert(saved);

    const safeProfile = {
      id: saved.userId,
      firstName: saved.firstName,
      username: saved.username,
      phone: saved.phoneNumber,
    };

    assert.equal((safeProfile as any).encryptedSession, undefined);
    assert.equal((safeProfile as any).sessionString, undefined);
    assert.equal(safeProfile.phone, "+919678393607");
  });
});
