import { describe, expect, it } from "vitest";
import { requirePlaywrightDatabaseTarget } from "@/lib/playwright-target";

describe("Playwright database safety guard", () => {
  const testUrl = "postgresql://test:secret@ep-isolated.example.neon.tech/scout?sslmode=require";

  it("requires explicit test URL and expected host", () => {
    expect(() => requirePlaywrightDatabaseTarget(undefined, undefined)).toThrow(/isolated test database/);
    expect(() => requirePlaywrightDatabaseTarget(testUrl, undefined)).toThrow(/isolated test database/);
  });

  it("rejects a URL whose host differs from the explicit allowlist", () => {
    expect(() => requirePlaywrightDatabaseTarget(testUrl, "production.example.neon.tech")).toThrow(/does not match/);
  });

  it("accepts an explicitly allowlisted PostgreSQL target", () => {
    expect(requirePlaywrightDatabaseTarget(testUrl, "ep-isolated.example.neon.tech")).toBe(testUrl);
  });
});
