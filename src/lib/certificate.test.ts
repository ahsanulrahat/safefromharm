import { describe, expect, it } from "vitest";
import { newCertificateId } from "@/lib/certificate";

describe("newCertificateId", () => {
  it("uses the SFH26 prefix and a non-confusing 8-character alphabet", () => {
    const id = newCertificateId();
    expect(id).toMatch(/^SFH26-[A-HJ-NP-Z2-9]{8}$/);
    expect(id).not.toMatch(/[0O1I]/);
  });

  it("produces distinct IDs across a sample", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newCertificateId()));
    expect(ids.size).toBe(500);
  });

  it("is different on every call", () => {
    expect(newCertificateId()).not.toBe(newCertificateId());
  });
});
