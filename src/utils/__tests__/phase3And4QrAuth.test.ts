import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { generateQrSvg, generateQrDataUrl } from "../../../server/qr-code-generator";
import { mapTelegramAuthError } from "../../../server/phone-validation";
import { Api } from "telegram";

describe("PHASE 3 & 4: Cloud MTProto Service & QR Authentication Flow", () => {
  // TEST 1: QR Vector SVG Generator produces clean tg://login?token=... SVG matrix
  it("1. generateQrSvg and generateQrDataUrl create valid SVG vector payload for MTProto token", () => {
    const dummyToken = "AQAB_DUMMY_BASE64_URL_TOKEN_12345_67890";
    const qrLink = "tg://login?token=" + dummyToken;
    
    const svgString = generateQrSvg(qrLink, 256);
    assert(svgString.includes("<svg"), "Contains root SVG tag");
    assert(svgString.includes("viewBox"), "Contains viewBox attribute");
    assert(svgString.includes("<rect"), "Contains SVG rectangles for matrix cells");

    const dataUrl = generateQrDataUrl(qrLink, 256);
    assert(dataUrl.startsWith("data:image/svg+xml;utf8,"), "Valid data URL prefix");
    assert(dataUrl.includes("%3Csvg"), "Encodes pure vector SVG");
  });

  // TEST 2: Error Mapping & Diagnostic Classification
  it("2. mapTelegramAuthError translates MTProto network and auth errors into actionable user feedback", () => {
    const netErr = new Error("connect ECONNREFUSED 149.154.167.91:443");
    const mappedNet = mapTelegramAuthError(netErr);
    assert.equal(mappedNet.code, "NETWORK_ERROR");
    assert(mappedNet.userMessage.includes("contact Telegram"), "Clear user message");

    const floodErr = new Error("FLOOD_WAIT_120");
    const mappedFlood = mapTelegramAuthError(floodErr);
    assert.equal(mappedFlood.code, "TELEGRAM_RATE_LIMIT");
    assert(mappedFlood.userMessage.includes("120 seconds"), "Actionable flood wait message");

    const pwdErr = new Error("SESSION_PASSWORD_NEEDED");
    const mappedPwd = mapTelegramAuthError(pwdErr);
    assert.equal(mappedPwd.code, "TWO_FACTOR_REQUIRED");
  });

  // TEST 3: MTProto API Type Definitions Availability
  it("3. GramJS MTProto Api.auth structures are correctly loaded on backend runtime", () => {
    assert(Api.auth.ExportLoginToken, "Api.auth.ExportLoginToken constructor available");
    assert(Api.auth.LoginToken, "Api.auth.LoginToken constructor available");
    assert(Api.auth.LoginTokenSuccess, "Api.auth.LoginTokenSuccess constructor available");
    assert(Api.auth.LoginTokenMigrateTo, "Api.auth.LoginTokenMigrateTo constructor available");
  });
});
