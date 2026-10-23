import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "sfh_participant";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return value;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function createParticipantToken(participantId: string) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${participantId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyParticipantToken(token: string | undefined | null) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [participantId, expires, signature] = parts;
  if (!participantId || !expires || !signature) return null;
  const payload = `${participantId}.${expires}`;
  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return null;
  if (Number(expires) < Date.now()) return null;
  return participantId;
}

export async function setParticipantSession(participantId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, createParticipantToken(participantId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearParticipantSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getParticipantId() {
  const store = await cookies();
  return verifyParticipantToken(store.get(COOKIE_NAME)?.value);
}
