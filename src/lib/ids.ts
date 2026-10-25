import crypto from "crypto";

export function newResumeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `SFH26-R-${code}`;
}

export function normalizeScoutId(value: string) {
  return normalizeDigits(value).trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizePhone(value: string) {
  const digits = normalizeDigits(value).replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return digits;
}

/** Converts Bengali and Arabic-Indic numerals to ASCII before validation/storage. */
export function normalizeDigits(value: string) {
  return value.replace(/[০-৯٠-٩]/g, (digit) => {
    const code = digit.codePointAt(0)!;
    return String(code >= 0x09e6 && code <= 0x09ef ? code - 0x09e6 : code - 0x0660);
  });
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/** Count whitespace-separated words, Unicode-friendly for Bangla. */
export function countWords(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}
