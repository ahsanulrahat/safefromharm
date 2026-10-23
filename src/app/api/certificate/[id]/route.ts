import { prisma } from "@/lib/prisma";
import { generateCertificate } from "@/lib/certificate";
import { rateLimit } from "@/lib/rate-limit";
import { ipFromRequest } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const limited = await rateLimit(
    `certificate:${ipFromRequest(request)}`,
    30,
    60_000
  );
  if (!limited.success) {
    return new Response("Too many requests. Please try again shortly.", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { id: id.toUpperCase() },
    include: { participant: { select: { nameEn: true } } },
  });

  if (!certificate) {
    return new Response("Certificate not found", { status: 404 });
  }
  if (certificate.revokedAt) {
    return new Response("This certificate has been revoked.", { status: 410 });
  }

  try {
    const pdf = await generateCertificate({
      certId: certificate.id,
      fullName: certificate.participant.nameEn,
      issuedAt: certificate.issuedAt,
    });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${certificate.id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
        "Content-Length": String(pdf.byteLength),
      },
    });
  } catch (error) {
    console.error("Certificate generation failed", error);
    return new Response("Could not generate certificate", { status: 500 });
  }
}
