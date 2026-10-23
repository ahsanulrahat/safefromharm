import crypto from "crypto";

const ALG = "aes-256-gcm";

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is required to encrypt sensitive responses.");
  }
  // Derive a stable 32-byte key from AUTH_SECRET.
  return crypto.createHash("sha256").update(`sfh-reflections:${secret}`).digest();
}

/** AES-256-GCM encryption for sensitive free-text answers at rest. */
export function encryptText(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString("base64")).join(".");
}

export function decryptText(payload: string) {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted payload");
  }
  const decipher = crypto.createDecipheriv(
    ALG,
    key(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
