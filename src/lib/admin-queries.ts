import { Prisma, type Section } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 20;
export const SECTIONS: Section[] = ["CUB", "SCOUT", "ROVER", "LEADER"];

export type CertificateFilter = "all" | "active" | "revoked" | "none";

export type ParticipantFilters = {
  q: string;
  section: Section | "";
  district: string;
  cert: CertificateFilter;
  page: number;
};

export type CertificateFilters = {
  q: string;
  status: "all" | "active" | "revoked";
  page: number;
};

export function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function clampPage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(first(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseParticipantFilters(
  input: Record<string, string | string[] | undefined>
): ParticipantFilters {
  const rawSection = first(input.section).toUpperCase();
  const section = (SECTIONS as string[]).includes(rawSection)
    ? (rawSection as Section)
    : "";
  const rawCert = first(input.cert);
  const cert: CertificateFilter = (
    ["active", "revoked", "none"] as CertificateFilter[]
  ).includes(rawCert as CertificateFilter)
    ? (rawCert as CertificateFilter)
    : "all";

  return {
    q: first(input.q).trim().slice(0, 80),
    section,
    district: first(input.district).trim().slice(0, 80),
    cert,
    page: clampPage(input.page),
  };
}

export function parseCertificateFilters(
  input: Record<string, string | string[] | undefined>
): CertificateFilters {
  const status = first(input.status);
  return {
    q: first(input.q).trim().slice(0, 80),
    status:
      status === "active" || status === "revoked" ? status : "all",
    page: clampPage(input.page),
  };
}

export function participantWhere(
  filters: ParticipantFilters
): Prisma.ParticipantWhereInput {
  const where: Prisma.ParticipantWhereInput = {};

  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { nameEn: { contains: q, mode: "insensitive" } },
      { fullNameBn: { contains: q } },
      { scoutId: { contains: q.toUpperCase() } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { unit: { contains: q, mode: "insensitive" } },
      { district: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.section) where.section = filters.section;
  if (filters.district) where.district = filters.district;

  switch (filters.cert) {
    case "active":
      where.certificates = { some: { revokedAt: null } };
      break;
    case "revoked":
      where.certificates = { some: { revokedAt: { not: null } } };
      break;
    case "none":
      where.certificates = { none: {} };
      break;
    default:
      break;
  }

  return where;
}

export function participantQueryString(
  filters: Partial<ParticipantFilters>,
  page?: number
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.section) params.set("section", filters.section);
  if (filters.district) params.set("district", filters.district);
  if (filters.cert && filters.cert !== "all") params.set("cert", filters.cert);
  const targetPage = page ?? filters.page;
  if (targetPage && targetPage > 1) params.set("page", String(targetPage));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function certificateQueryString(
  filters: Partial<CertificateFilters>,
  page?: number
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  const targetPage = page ?? filters.page;
  if (targetPage && targetPage > 1) params.set("page", String(targetPage));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listParticipants(filters: ParticipantFilters) {
  const where = participantWhere(filters);

  const [total, moduleCount] = await Promise.all([
    prisma.participant.count({ where }),
    prisma.module.count({ where: { published: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pages);

  const participants = await prisma.participant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      fullNameBn: true,
      nameEn: true,
      scoutId: true,
      unit: true,
      district: true,
      section: true,
      createdAt: true,
      isMinor: true,
    },
  });

  const ids = participants.map((p) => p.id);
  const [completedGroups, certificates] = await Promise.all([
    ids.length
      ? prisma.moduleProgress.groupBy({
          by: ["participantId"],
          where: {
            participantId: { in: ids },
            completedAt: { not: null },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    ids.length
      ? prisma.certificate.findMany({
          where: { participantId: { in: ids } },
          orderBy: { issuedAt: "desc" },
          select: {
            id: true,
            participantId: true,
            issuedAt: true,
            revokedAt: true,
            activeKey: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const completedByParticipant = new Map(
    completedGroups.map((group) => [group.participantId, group._count._all])
  );
  const certificateByParticipant = new Map<
    string,
    (typeof certificates)[number]
  >();
  for (const certificate of certificates) {
    if (!certificateByParticipant.has(certificate.participantId)) {
      certificateByParticipant.set(certificate.participantId, certificate);
    }
  }

  return {
    total,
    pages,
    page,
    moduleCount,
    participants: participants.map((participant) => ({
      ...participant,
      completedModules: completedByParticipant.get(participant.id) ?? 0,
      certificate: certificateByParticipant.get(participant.id) ?? null,
    })),
  };
}

export async function getParticipant(id: string) {
  return prisma.participant.findUnique({
    where: { id },
    include: {
      certificates: { orderBy: { issuedAt: "desc" } },
    },
  });
}

export async function getDistricts() {
  const rows = await prisma.participant.findMany({
    distinct: ["district"],
    select: { district: true },
    orderBy: { district: "asc" },
  });
  return rows.map((row) => row.district);
}

export async function listCertificates(filters: CertificateFilters) {
  const where: Prisma.CertificateWhereInput = {};

  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { id: { contains: q.toUpperCase() } },
      { participant: { nameEn: { contains: q, mode: "insensitive" } } },
      { participant: { fullNameBn: { contains: q } } },
      { participant: { scoutId: { contains: q.toUpperCase() } } },
    ];
  }
  if (filters.status === "active") where.revokedAt = null;
  if (filters.status === "revoked") where.revokedAt = { not: null };

  const [total, active, revoked] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.count({ where: { revokedAt: null } }),
    prisma.certificate.count({ where: { revokedAt: { not: null } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pages);

  const certificates = await prisma.certificate.findMany({
    where,
    orderBy: { issuedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      participant: {
        select: { nameEn: true, scoutId: true, unit: true, district: true },
      },
    },
  });

  return { total, pages, page, active, revoked, certificates };
}

function dhakaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function getDashboardData() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalParticipants,
    activeCertificates,
    revokedCertificates,
    completers,
    recent,
    districts,
    units,
    sectionGroups,
    modules,
    startedGroups,
    watchedGroups,
    completedGroups,
  ] = await Promise.all([
    prisma.participant.count(),
    prisma.certificate.count({ where: { revokedAt: null } }),
    prisma.certificate.count({ where: { revokedAt: { not: null } } }),
    prisma.participant.count({ where: { certificates: { some: {} } } }),
    prisma.participant.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.participant.groupBy({
      by: ["district"],
      _count: { _all: true },
      orderBy: { _count: { district: "desc" } },
      take: 8,
    }),
    prisma.participant.groupBy({
      by: ["unit"],
      _count: { _all: true },
      orderBy: { _count: { unit: "desc" } },
      take: 8,
    }),
    prisma.participant.groupBy({
      by: ["section"],
      _count: { _all: true },
    }),
    prisma.module.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      select: { id: true, titleEn: true, titleBn: true, order: true },
    }),
    prisma.moduleProgress.groupBy({
      by: ["moduleId"],
      _count: { _all: true },
    }),
    prisma.moduleProgress.groupBy({
      by: ["moduleId"],
      where: { videoWatchedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.moduleProgress.groupBy({
      by: ["moduleId"],
      where: { completedAt: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const byDate = new Map<string, number>();
  for (const row of recent) {
    const key = dhakaDateKey(row.createdAt);
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }

  const registrations: Array<{ date: string; full: string; count: number }> = [];
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const full = dhakaDateKey(day);
    registrations.push({
      date: full.slice(5),
      full,
      count: byDate.get(full) ?? 0,
    });
  }

  const started = new Map(
    startedGroups.map((row) => [row.moduleId, row._count._all])
  );
  const watched = new Map(
    watchedGroups.map((row) => [row.moduleId, row._count._all])
  );
  const completed = new Map(
    completedGroups.map((row) => [row.moduleId, row._count._all])
  );

  const sectionOrder = new Map(SECTIONS.map((section, index) => [section, index]));
  const sections = sectionGroups
    .map((row) => ({ name: row.section, count: row._count._all }))
    .sort(
      (a, b) =>
        (sectionOrder.get(a.name) ?? 0) - (sectionOrder.get(b.name) ?? 0)
    );

  return {
    totalParticipants,
    activeCertificates,
    revokedCertificates,
    completers,
    completionRate:
      totalParticipants > 0 ? completers / totalParticipants : 0,
    registrations30: recent.length,
    registrations,
    districts: districts.map((row) => ({
      name: row.district,
      count: row._count._all,
    })),
    units: units.map((row) => ({ name: row.unit, count: row._count._all })),
    sections,
    funnel: modules.map((module) => ({
      name: `M${module.order + 1} · ${module.titleEn.slice(0, 18)}`,
      started: started.get(module.id) ?? 0,
      watched: watched.get(module.id) ?? 0,
      completed: completed.get(module.id) ?? 0,
    })),
  };
}
