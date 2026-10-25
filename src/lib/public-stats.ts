import { prisma } from "@/lib/prisma";

/**
 * Fetches real-time participation statistics for the homepage.
 * Uses only existing database tables and schema - no modifications needed.
 */
export async function getPublicStats() {
  try {
    const [totalParticipants, totalCertificates, totalModules] =
      await Promise.all([
        prisma.participant.count(),
        prisma.certificate.count({ where: { revokedAt: null } }),
        prisma.module.count({ where: { published: true } }),
      ]);

    return {
      totalParticipants,
      totalCertificates,
      totalModules,
    };
  } catch {
    // If DB is unavailable, return zeros rather than crashing the homepage.
    return {
      totalParticipants: 0,
      totalCertificates: 0,
      totalModules: 0,
    };
  }
}
