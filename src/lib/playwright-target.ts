/**
 * Require an explicitly approved database host for browser tests that create
 * or delete participant data. Never fall back to dotenv files in this suite.
 */
export function requirePlaywrightDatabaseTarget(
  databaseUrl: string | undefined,
  expectedHost: string | undefined,
): string {
  if (!databaseUrl || !expectedHost?.trim()) {
    throw new Error(
      "Set PLAYWRIGHT_E2E_DATABASE_URL and PLAYWRIGHT_E2E_DATABASE_HOST to an isolated test database before running browser tests.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("PLAYWRIGHT_E2E_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error("PLAYWRIGHT_E2E_DATABASE_URL must use PostgreSQL.");
  }

  if (parsed.hostname !== expectedHost.trim()) {
    throw new Error(
      "PLAYWRIGHT_E2E_DATABASE_URL host does not match PLAYWRIGHT_E2E_DATABASE_HOST; refusing to start browser tests.",
    );
  }

  return databaseUrl;
}
