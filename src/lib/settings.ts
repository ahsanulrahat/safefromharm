import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const DEFAULT_PASS_MARK = 70;
export const ACTIVE_CERTIFICATE = { revokedAt: null } as const;

/** Read a configurable setting, falling back to a safe default. */
export const getSetting = cache(async (key: string, fallback: string) => {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
});

export const getPassMark = cache(async () => {
  const raw = await getSetting("mcqPassMark", String(DEFAULT_PASS_MARK));
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : DEFAULT_PASS_MARK;
});
