import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setParticipantSession } from "@/lib/participant-session";
import { rateLimit } from "@/lib/rate-limit";
import { ipFromRequest } from "@/lib/request";

/**
 * Short resume link: /r/<resumeCode> sets the signed participant cookie and
 * redirects to the course. Scoped to the participant; no passwords involved.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("l") === "en" ? "en" : "bn";

  const limited = await rateLimit(
    `resume-link:${ipFromRequest(request)}`,
    20,
    10 * 60_000
  );
  if (!limited.success) {
    return NextResponse.redirect(new URL(`/${locale}/resume?error=rate`, url.origin));
  }

  const participant = await prisma.participant.findUnique({
    where: { resumeCode: code.trim().toUpperCase() },
    select: { id: true },
  });
  if (!participant) {
    return NextResponse.redirect(new URL(`/${locale}/resume`, url.origin));
  }

  await setParticipantSession(participant.id);
  return NextResponse.redirect(new URL(`/${locale}/course`, url.origin));
}
