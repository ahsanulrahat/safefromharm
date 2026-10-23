import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Append-only record of sensitive admin access and mutations. */
export async function audit(input: {
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  targetType: string;
  targetId: string;
}) {
  try {
    await prisma.auditLog.create({ data: input });
  } catch (error) {
    // Auditing must never take down an admin page, but log loudly.
    console.error("Failed to write audit log", error);
  }
}
