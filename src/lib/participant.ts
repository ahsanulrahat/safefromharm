import { prisma } from "@/lib/prisma";
import { getParticipantId } from "@/lib/participant-session";
import { redirect } from "next/navigation";

/**
 * Server-only helper for participant pages. Redirects to the resume page
 * when there is no valid session.
 */
export async function requireParticipant(locale: string) {
  const id = await getParticipantId();
  if (!id) redirect(`/${locale}/resume`);
  const participant = await prisma.participant.findUnique({ where: { id } });
  if (!participant) redirect(`/${locale}/resume`);
  return participant;
}

export async function getOptionalParticipant() {
  const id = await getParticipantId();
  if (!id) return null;
  return prisma.participant.findUnique({ where: { id } });
}
