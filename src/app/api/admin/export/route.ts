import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { parseParticipantFilters, participantWhere } from "@/lib/admin-queries";
import { hasAdminPermission } from "@/lib/roles";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const MAX_ROWS = 10_000;

function cell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Participant CSV export for organizers.
 *
 * Deliberately excludes reflection answers and any encrypted fields. The
 * export is audited. Filters match the participant list page.
 */
export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!hasAdminPermission(admin.role, "participants:export")) {
    return new Response("Forbidden", { status: 403 });
  }
  if (admin.mustChangePassword) {
    return new Response("Password change required", { status: 403 });
  }

  const url = new URL(request.url);
  const filters = parseParticipantFilters(
    Object.fromEntries(url.searchParams.entries())
  );

  if (admin.role === "REPORTING_ADMIN") {
    const reports = await prisma.$queryRaw<Array<{
      month: Date;
      audience: string;
      registrations: number;
      completers: number;
      activeCertificates: number;
      revokedCertificates: number;
    }>>(Prisma.sql`
      WITH published_modules AS (
        SELECT COUNT(*)::int AS total FROM "Module" WHERE "published" = TRUE
      ), participant_progress AS (
        SELECT "participantId", COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL)::int AS completed
        FROM "ModuleProgress" GROUP BY "participantId"
      ), certificate_counts AS (
        SELECT "participantId",
          COUNT(*) FILTER (WHERE "activeKey" IS NOT NULL)::int AS active,
          COUNT(*) FILTER (WHERE "revokedAt" IS NOT NULL)::int AS revoked
        FROM "Certificate" GROUP BY "participantId"
      )
      SELECT DATE_TRUNC('month', p."createdAt") AS month,
        p."audience"::text AS audience,
        COUNT(*)::int AS registrations,
        COUNT(*) FILTER (WHERE COALESCE(pp.completed, 0) >= pm.total)::int AS completers,
        SUM(COALESCE(cc.active, 0))::int AS "activeCertificates",
        SUM(COALESCE(cc.revoked, 0))::int AS "revokedCertificates"
      FROM "Participant" p
      LEFT JOIN participant_progress pp ON pp."participantId" = p."id"
      LEFT JOIN certificate_counts cc ON cc."participantId" = p."id"
      CROSS JOIN published_modules pm
      GROUP BY DATE_TRUNC('month', p."createdAt"), p."audience"
      ORDER BY month DESC, audience ASC
    `);
    const lines = [
      ["Month", "Member type", "Registrations", "Course completers", "Active certificates", "Revoked certificates"].map(cell).join(","),
      ...reports.map((report) => {
        return [
          report.month.toISOString().slice(0, 7),
          report.audience,
          report.registrations,
          report.completers,
          report.activeCertificates,
          report.revokedCertificates,
        ].map(cell).join(",");
      }),
    ];
    await audit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "PARTICIPANTS_EXPORT_AGGREGATE",
      targetType: "Report",
      targetId: `monthly-aggregate.csv (${reports.length} rows)`,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="scout-moot-2026-monthly-report-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const participants = await prisma.participant.findMany({
    where: participantWhere(filters),
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      scoutId: true,
      fullNameBn: true,
      nameEn: true,
      unit: true,
      district: true,
      audience: true,
      phone: true,
      email: true,
      isMinor: true,
      guardianConsent: true,
      consentAt: true,
      createdAt: true,
      moduleProgress: { select: { completedAt: true } },
      certificates: {
        orderBy: { issuedAt: "desc" },
        take: 1,
        select: { id: true, issuedAt: true, revokedAt: true },
      },
    },
  });

  const header = [
    "Scout ID",
    "Full name (Bangla)",
    "Certificate name (English)",
    "Unit",
    "District",
    "Member type",
    "Phone",
    "Email",
    "Under 18",
    "Guardian consent",
    "Consent given at",
    "Registered at",
    "Modules completed",
    "Certificate ID",
    "Certificate status",
    "Certificate issued at",
  ];

  const lines = [header.map(cell).join(",")];
  for (const participant of participants) {
    const completedModules = participant.moduleProgress.filter(
      (progress) => progress.completedAt
    ).length;
    const certificate = participant.certificates[0];
    const certificateStatus = !certificate
      ? "none"
      : certificate.revokedAt
        ? "revoked"
        : "active";

    lines.push(
      [
        participant.scoutId,
        participant.fullNameBn,
        participant.nameEn,
        participant.unit,
        participant.district,
        participant.audience,
        participant.phone ?? "",
        participant.email ?? "",
        participant.isMinor ? "yes" : "no",
        participant.isMinor
          ? participant.guardianConsent
            ? "yes"
            : "no"
          : "",
        participant.consentAt.toISOString(),
        participant.createdAt.toISOString(),
        completedModules,
        certificate?.id ?? "",
        certificateStatus,
        certificate?.issuedAt.toISOString() ?? "",
      ]
        .map(cell)
        .join(",")
    );
  }

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: "PARTICIPANTS_EXPORT",
    targetType: "Report",
    targetId: `participants.csv (${participants.length} rows)`,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const csv = `\uFEFF${lines.join("\r\n")}\r\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scout-moot-2026-participants-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
