import { beforeEach, describe, expect, it, vi } from "vitest";

const counts = vi.hoisted(() => ({
  participants: vi.fn(),
  certificates: vi.fn(),
  modules: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    participant: { count: counts.participants },
    certificate: { count: counts.certificates },
    module: { count: counts.modules },
  },
}));

import { getPublicStats } from "@/lib/public-stats";

describe("getPublicStats", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns exact aggregate counts, including truthful zeroes", async () => {
    counts.participants.mockResolvedValue(0);
    counts.certificates.mockResolvedValue(0);
    counts.modules.mockResolvedValue(3);

    await expect(getPublicStats()).resolves.toEqual({
      available: true,
      totalParticipants: 0,
      totalCertificates: 0,
      totalModules: 3,
    });
  });

  it("reports an unavailable state when a database aggregate fails", async () => {
    counts.participants.mockRejectedValue(new Error("database unavailable"));
    counts.certificates.mockResolvedValue(0);
    counts.modules.mockResolvedValue(0);

    await expect(getPublicStats()).resolves.toEqual({ available: false });
  });
});
