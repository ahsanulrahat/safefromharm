import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { newCertificateId } from "@/lib/certificate";

/**
 * Create a certificate with a collision-safe ID. `newCertificateId()` is
 * provided by lib/certificate.ts and uses a non-confusing alphabet.
 */
export async function createCertificate(participantId: string, replacesId?: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const id = newCertificateId();
    try {
      return await prisma.certificate.create({
        data: {
          id,
          participantId,
          replacesId: replacesId ?? null,
          activeKey: participantId,
        },
      });
    } catch (error) {
      lastError = error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // Either the random ID collided (retry) or another request already
        // issued the active certificate (return it).
        const existing = await prisma.certificate.findFirst({
          where: { participantId, activeKey: participantId },
        });
        if (existing) return existing;
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not allocate a certificate ID");
}

/** Issue only once; revoked certificates are never auto-reissued. */
export async function issueCertificateIfEligible(participantId: string) {
  const existing = await prisma.certificate.findFirst({
    where: { participantId },
    orderBy: { issuedAt: "desc" },
  });
  if (existing) return existing;
  return createCertificate(participantId);
}

export async function reissueCertificate(participantId: string, previousId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.certificate.updateMany({
      where: { participantId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedReason: "Re-issued",
        activeKey: null,
      },
    });
    // createCertificate uses the global client; do the create in the same
    // transaction via a small retry loop here to preserve atomicity.
    let lastError: unknown;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        return await tx.certificate.create({
          data: {
            id: newCertificateId(),
            participantId,
            replacesId: previousId,
            activeKey: participantId,
          },
        });
      } catch (error) {
        lastError = error;
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Re-issue failed");
  });
}
