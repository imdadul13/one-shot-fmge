// ============================================================================
// ONE SHOT FMGE — Canonical International Phone Normalizer & Validator
// Standard: ITU-T Recommendation E.164 (+<country_code><subscriber_number>)
// ============================================================================

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedE164: string;
  countryCode?: string;
  nationalNumber?: string;
  digitsOnly: string;
  error?: string;
}

const COUNTRY_DIAL_CODES: Record<string, string> = {
  "1": "US/CA (+1)",
  "44": "UK (+44)",
  "63": "Philippines (+63)",
  "91": "India (+91)",
  "86": "China (+86)",
  "81": "Japan (+81)",
  "49": "Germany (+49)",
  "33": "France (+33)",
  "39": "Italy (+39)",
  "7": "Russia/Kazakhstan (+7)",
  "971": "UAE (+971)",
  "966": "Saudi Arabia (+966)",
  "880": "Bangladesh (+880)",
  "977": "Nepal (+977)",
  "94": "Sri Lanka (+94)",
  "60": "Malaysia (+60)",
  "62": "Indonesia (+62)",
  "65": "Singapore (+65)",
  "84": "Vietnam (+84)",
  "20": "Egypt (+20)",
  "234": "Nigeria (+234)",
  "27": "South Africa (+27)",
  "92": "Pakistan (+92)",
  "98": "Iran (+98)",
  "90": "Turkey (+90)",
  "380": "Ukraine (+380)",
  "48": "Poland (+48)",
  "55": "Brazil (+55)",
  "52": "Mexico (+52)",
  "61": "Australia (+61)",
  "64": "New Zealand (+64)",
};

/**
 * Canonical phone normalizer and validator across ONE SHOT FMGE.
 * Normalizes any international input to E.164: +<country_code><national_number>
 */
export function normalizeTelegramPhoneNumber(rawInput: string): PhoneValidationResult {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      isValid: false,
      normalizedE164: "",
      digitsOnly: "",
      error: "Please enter a valid international phone number, e.g. +91XXXXXXXXXX or +63XXXXXXXXXX",
    };
  }

  let cleaned = rawInput.trim();

  // Convert international 00-prefix to '+'
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // Remove common punctuation: spaces, hyphens, brackets, dots, slashes
  cleaned = cleaned.replace(/[\s\-\(\)\.\/\_]/g, "");

  // If missing leading '+', prepend it
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  // Extract digits
  const digits = cleaned.replace(/[^0-9]/g, "");
  const normalized = "+" + digits;

  // E.164: + followed by 1-9 and 6 to 14 subscriber digits (total 7-15 digits)
  const e164Regex = /^\+[1-9]\d{6,14}$/;

  if (!e164Regex.test(normalized)) {
    return {
      isValid: false,
      normalizedE164: normalized,
      digitsOnly: digits,
      error: "Enter a valid international phone number with country code, e.g. +919678393607 or +639123456789",
    };
  }

  let countryCode = "";
  let nationalNumber = "";

  for (let len = 3; len >= 1; len--) {
    const candidate = digits.slice(0, len);
    if (COUNTRY_DIAL_CODES[candidate]) {
      countryCode = candidate;
      nationalNumber = digits.slice(len);
      break;
    }
  }

  if (!countryCode) {
    countryCode = digits.slice(0, 2);
    nationalNumber = digits.slice(2);
  }

  return {
    isValid: true,
    normalizedE164: normalized,
    countryCode: "+" + countryCode,
    nationalNumber,
    digitsOnly: digits,
  };
}

// Backward compatibility alias
export const normalizePhoneNumber = normalizeTelegramPhoneNumber;

/**
 * Separate frontend validation errors from backend API & Telegram MTProto errors.
 */
export function mapTelegramAuthError(rawError: any): {
  code: string;
  userMessage: string;
  category: "VALIDATION" | "TELEGRAM_RPC" | "NETWORK" | "AUTH_CONFIG" | "RATE_LIMIT" | "UNKNOWN";
} {
  const msg = String(rawError?.message || rawError?.errorMessage || rawError || "");

  // 1. Telegram RPC Phone Number Rejection
  if (/PHONE_NUMBER_INVALID/i.test(msg)) {
    return {
      code: "PHONE_NUMBER_INVALID",
      category: "TELEGRAM_RPC",
      userMessage: "Telegram rejected this phone number. Ensure it matches your registered Telegram account.",
    };
  }

  // 2. Unregistered phone number
  if (/PHONE_NUMBER_UNREGISTERED|PHONE_NOT_REGISTERED|USER_DEACTIVATED/i.test(msg)) {
    return {
      code: "PHONE_NOT_REGISTERED",
      category: "TELEGRAM_RPC",
      userMessage: "This phone number is not registered with Telegram. Please create a Telegram account first.",
    };
  }

  // 3. Verification Code Invalid
  if (/PHONE_CODE_INVALID|INVALID_CODE|PHONE_CODE_INCORRECT/i.test(msg)) {
    return {
      code: "PHONE_CODE_INVALID",
      category: "TELEGRAM_RPC",
      userMessage: "The verification code is incorrect. Please check the code sent to your official Telegram app.",
    };
  }

  // 4. Verification Code Expired
  if (/PHONE_CODE_EXPIRED|CODE_EXPIRED/i.test(msg)) {
    return {
      code: "PHONE_CODE_EXPIRED",
      category: "TELEGRAM_RPC",
      userMessage: "The verification code has expired. Please request a new code.",
    };
  }

  // 5. 2FA Password Needed
  if (/SESSION_PASSWORD_NEEDED|TWO_FACTOR_REQUIRED|2FA/i.test(msg)) {
    return {
      code: "TWO_FACTOR_REQUIRED",
      category: "TELEGRAM_RPC",
      userMessage: "Your Telegram account has two-step verification enabled. Please enter your 2FA cloud password.",
    };
  }

  // 6. 2FA Password Incorrect
  if (/PASSWORD_HASH_INVALID|PASSWORD_INVALID/i.test(msg)) {
    return {
      code: "PASSWORD_INVALID",
      category: "TELEGRAM_RPC",
      userMessage: "The 2FA cloud password is incorrect.",
    };
  }

  // 7. Rate Limit / Flood Wait
  if (/FLOOD_WAIT|RATE_LIMIT|SLOWMODE/i.test(msg)) {
    const match = msg.match(/FLOOD_WAIT_(\d+)/i);
    const seconds = match ? match[1] : "60";
    return {
      code: "TELEGRAM_RATE_LIMIT",
      category: "RATE_LIMIT",
      userMessage: "Telegram is temporarily limiting verification attempts. Please try again in " + seconds + " seconds.",
    };
  }

  // 8. API Credentials Configuration
  if (/API_ID_INVALID|API_ID_PUBLISHED_FLOOD|API_KEY_INVALID/i.test(msg)) {
    return {
      code: "AUTH_CONFIG_ERROR",
      category: "AUTH_CONFIG",
      userMessage: "Telegram API credentials (API ID / API Hash) are invalid or not configured on the server.",
    };
  }

  // 9. Network / Connection Errors
  if (/CONNECTION_FAILED|NETWORK_ERROR|ECONNREFUSED|ETIMEDOUT|EPERM|EHOSTUNREACH|fetch failed|Could not connect/i.test(msg)) {
    return {
      code: "NETWORK_ERROR",
      category: "NETWORK",
      userMessage: "Unable to contact Telegram MTProto servers. Please check cloud server internet access.",
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    category: "UNKNOWN",
    userMessage: msg || "Telegram authentication failed. Please try again.",
  };
}
