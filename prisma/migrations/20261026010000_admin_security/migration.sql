-- Additive admin security migration. Existing credentials and role assignments
-- are preserved; old role values are mapped to their least-privilege runtime
-- equivalents in src/lib/roles.ts.
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'CONTENT_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'SAFEGUARDING_REVIEWER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'REPORTING_ADMIN';

ALTER TABLE "AdminUser"
  ADD COLUMN "loginId" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- A stable, unique login alias is assigned without changing the existing email
-- login. Admins can replace this alias from My account after the rollout.
UPDATE "AdminUser" SET "loginId" = 'admin-' || "id" WHERE "loginId" IS NULL;
ALTER TABLE "AdminUser" ALTER COLUMN "loginId" SET NOT NULL;
CREATE UNIQUE INDEX "AdminUser_loginId_key" ON "AdminUser"("loginId");

CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "ipAddress" VARCHAR(64),
  "userAgent" VARCHAR(512),
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditLog"
  ADD COLUMN "actorId" TEXT,
  ADD COLUMN "before" JSONB,
  ADD COLUMN "after" JSONB,
  ADD COLUMN "ipAddress" VARCHAR(64),
  ADD COLUMN "userAgent" VARCHAR(512);

CREATE INDEX "AdminSession_adminId_revokedAt_expiresAt_idx"
  ON "AdminSession"("adminId", "revokedAt", "expiresAt");
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_targetType_targetId_createdAt_idx"
  ON "AuditLog"("targetType", "targetId", "createdAt");

ALTER TABLE "AdminSession"
  ADD CONSTRAINT "AdminSession_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Prevent application or accidental SQL from rewriting or deleting audit
-- entries. New records remain insertable by the application's DB role.
CREATE FUNCTION "prevent_audit_log_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_append_only"
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION "prevent_audit_log_mutation"();
