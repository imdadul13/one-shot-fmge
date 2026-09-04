import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  normalizeTelegramPhoneNumber,
  normalizePhoneNumber,
  mapTelegramAuthError,
} from "../phoneValidation";
import { generateQrDataUrl } from "../qrCodeGenerator";

describe("ONE SHOT FMGE — International Phone Number Validator & E.164 Normalizer", () => {
  // TEST 1: India (+91) validation and normalization
  it("TEST 1: Validates and normalizes Indian phone numbers in various user input formats", () => {
    const userPromptNumber = normalizeTelegramPhoneNumber("+919678393607");
    assert.equal(userPromptNumber.isValid, true);
    assert.equal(userPromptNumber.normalizedE164, "+919678393607");
    assert.equal(userPromptNumber.countryCode, "+91");
    assert.equal(userPromptNumber.nationalNumber, "9678393607");

    const cases = [
      "+919876543210",
      "+91 98765 43210",
      "+91-98765-43210",
      "919876543210",
      "00919876543210",
      "+91 (987) 654-3210",
    ];

    for (const input of cases) {
      const res = normalizeTelegramPhoneNumber(input);
      assert.equal(res.isValid, true, `Expected ${input} to be valid`);
      assert.equal(res.normalizedE164, "+919876543210");
      assert.equal(res.countryCode, "+91");
      assert.equal(res.nationalNumber, "9876543210");
    }
  });

  // TEST 2: Philippines (+63) validation and normalization
  it("TEST 2: Validates and normalizes Philippines phone numbers in various input formats", () => {
    const cases = [
      "+639123456789",
      "+63 912 345 6789",
      "+63-912-345-6789",
      "639123456789",
      "00639123456789",
    ];

    for (const input of cases) {
      const res = normalizePhoneNumber(input);
      assert.equal(res.isValid, true, `Expected ${input} to be valid`);
      assert.equal(res.normalizedE164, "+639123456789");
      assert.equal(res.countryCode, "+63");
      assert.equal(res.nationalNumber, "9123456789");
    }
  });

  // TEST 3: United States (+1) validation and normalization
  it("TEST 3: Validates and normalizes US/Canada phone numbers in various input formats", () => {
    const cases = [
      "+14155552671",
      "+1 (415) 555-2671",
      "14155552671",
      "+1-415-555-2671",
      "0014155552671",
    ];

    for (const input of cases) {
      const res = normalizePhoneNumber(input);
      assert.equal(res.isValid, true, `Expected ${input} to be valid`);
      assert.equal(res.normalizedE164, "+14155552671");
      assert.equal(res.countryCode, "+1");
      assert.equal(res.nationalNumber, "4155552671");
    }
  });

  // TEST 4: United Kingdom (+44) and Germany (+49) validation
  it("TEST 4: Validates European country phone numbers", () => {
    const uk = normalizePhoneNumber("+44 7911 123456");
    assert.equal(uk.isValid, true);
    assert.equal(uk.normalizedE164, "+447911123456");
    assert.equal(uk.countryCode, "+44");

    const de = normalizePhoneNumber("+49 151 23456789");
    assert.equal(de.isValid, true);
    assert.equal(de.normalizedE164, "+4915123456789");
    assert.equal(de.countryCode, "+49");
  });

  // TEST 5: Rejection of invalid phone numbers
  it("TEST 5: Rejects invalid, empty, or malformed numbers cleanly with helpful message", () => {
    const invalidCases = [
      "",
      "   ",
      "abcdef",
      "+123", // Too short (< 7 digits)
      "+0123456789", // Country code starts with 0
      "123",
      "+91", // Just country code
    ];

    for (const input of invalidCases) {
      const res = normalizePhoneNumber(input);
      assert.equal(res.isValid, false, `Expected ${input} to be invalid`);
      assert(res.error, "Error message provided");
      assert.match(res.error, /valid international phone number/i);
      assert.doesNotMatch(res.error, /The string did not match the expected pattern/i);
    }
  });

  // TEST 6: Error code mapping
  it("TEST 6: Maps Telegram RPC errors into user-friendly guidance", () => {
    const phoneInvalid = mapTelegramAuthError("PHONE_NUMBER_INVALID");
    assert.equal(phoneInvalid.code, "PHONE_NUMBER_INVALID");
    assert.match(phoneInvalid.userMessage, /rejected this phone number/i);

    const phoneUnregistered = mapTelegramAuthError("PHONE_NUMBER_UNREGISTERED");
    assert.equal(phoneUnregistered.code, "PHONE_NOT_REGISTERED");
    assert.match(phoneUnregistered.userMessage, /not registered with Telegram/i);

    const codeInvalid = mapTelegramAuthError("PHONE_CODE_INVALID");
    assert.equal(codeInvalid.code, "PHONE_CODE_INVALID");
    assert.match(codeInvalid.userMessage, /verification code is incorrect/i);

    const codeExpired = mapTelegramAuthError("PHONE_CODE_EXPIRED");
    assert.equal(codeExpired.code, "PHONE_CODE_EXPIRED");
    assert.match(codeExpired.userMessage, /expired/i);

    const twoFactor = mapTelegramAuthError("SESSION_PASSWORD_NEEDED");
    assert.equal(twoFactor.code, "TWO_FACTOR_REQUIRED");
    assert.match(twoFactor.userMessage, /two-step verification/i);

    const floodWait = mapTelegramAuthError("FLOOD_WAIT_180");
    assert.equal(floodWait.code, "TELEGRAM_RATE_LIMIT");
    assert.match(floodWait.userMessage, /180 seconds/i);

    const netErr = mapTelegramAuthError("CONNECTION_FAILED");
    assert.equal(netErr.code, "NETWORK_ERROR");
    assert.match(netErr.userMessage, /contact Telegram/i);
  });

  // TEST 7: Telegram QR Login Token & Data URL Generation
  it("TEST 7: Generates valid SVG matrix & data URL for Telegram MTProto QR Login (tg://login?token=...)", () => {
    const mockTokenUrl = "tg://login?token=AQAAAMwAAAAA1234567890abcdef";
    const dataUrl = generateQrDataUrl(mockTokenUrl, 256);
    assert(dataUrl.startsWith("data:image/svg+xml;utf8,"), "Must produce valid SVG data URL");
    assert(dataUrl.includes("%3Csvg"), "Must contain encoded SVG opening tag");
    assert(dataUrl.includes("%230F172A"), "Must contain matrix rectangle fills");
  });
});
