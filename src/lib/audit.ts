import type { AdminRole, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { safeErrorDetails } from "@/lib/safe-log";

/** Append-only record of sensitive admin access and mutations. */
export async function audit(input: {
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  targetType: string;
  targetId: string;
  actorId?: string;
  before?: object | null;
  after?: object | null;
  required?: boolean;
  tx?: Prisma.TransactionClient;
}) {
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for");
    const ipAddress =
      (forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip"))?.slice(0, 64) ??
      null;
    const db = input.tx ?? prisma;
    const actorId =
      input.actorId ??
      (await db.adminUser.findUnique({
        where: { email: input.actorEmail },
        select: { id: true },
      }))?.id;

    await db.auditLog.create({
      data: {
        actorId,
        actorEmail: input.actorEmail,
        actorRole: input.actorRole,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        before: input.before ? JSON.parse(JSON.stringify(input.before)) : undefined,
        after: input.after ? JSON.parse(JSON.stringify(input.after)) : undefined,
        ipAddress,
        userAgent: requestHeaders.get("user-agent")?.slice(0, 512) ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", safeErrorDetails(error));
    throw error;
  }
}
