-- Additive content authoring and version history. Existing course content and
-- participant responses are preserved and receive a baseline version.
ALTER TYPE "StepType" ADD VALUE IF NOT EXISTS 'MULTI_SELECT';
ALTER TYPE "StepType" ADD VALUE IF NOT EXISTS 'SCENARIO';
ALTER TYPE "StepType" ADD VALUE IF NOT EXISTS 'PARAGRAPH';

CREATE TYPE "ContentVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "SubmissionReviewStatus" AS ENUM (
  'NOT_REQUIRED', 'PENDING', 'APPROVED', 'REVISION_REQUESTED'
);

ALTER TABLE "Participant"
  ADD COLUMN "extraFields" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "Module"
  ADD COLUMN "writtenBn" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "writtenEn" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "mustWatch" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN "attemptsAllowed" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "paragraphApprovalRequired" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Step"
  ADD COLUMN "explanationBn" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "explanationEn" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "points" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "correctOptionIds" JSONB,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE TABLE "ModuleContentVersion" (
  "id" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "ContentVersionStatus" NOT NULL DEFAULT 'DRAFT',
  "snapshot" JSONB NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "ModuleContentVersion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StepProgress"
  ADD COLUMN "contentVersionId" TEXT,
  ADD COLUMN "reviewStatus" "SubmissionReviewStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "reviewComment" TEXT,
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "ModuleContentVersion"
  ADD CONSTRAINT "ModuleContentVersion_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ModuleContentVersion_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StepProgress"
  ADD CONSTRAINT "StepProgress_contentVersionId_fkey"
    FOREIGN KEY ("contentVersionId") REFERENCES "ModuleContentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StepProgress_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ModuleContentVersion_moduleId_version_key"
  ON "ModuleContentVersion"("moduleId", "version");
CREATE INDEX "ModuleContentVersion_moduleId_status_createdAt_idx"
  ON "ModuleContentVersion"("moduleId", "status", "createdAt");
CREATE INDEX "StepProgress_contentVersionId_idx"
  ON "StepProgress"("contentVersionId");
CREATE INDEX "StepProgress_reviewStatus_updatedAt_idx"
  ON "StepProgress"("reviewStatus", "updatedAt");

-- Snapshot each module's current published or unpublished state before any
-- drafts are introduced. Correct answers stay in server-side JSON only.
INSERT INTO "ModuleContentVersion"
  ("id", "moduleId", "version", "status", "snapshot", "createdAt", "publishedAt")
SELECT
  'legacy-' || m."id",
  m."id",
  1,
  CASE WHEN m."published" THEN 'PUBLISHED'::"ContentVersionStatus"
       ELSE 'DRAFT'::"ContentVersionStatus" END,
  jsonb_build_object(
    'slug', m."slug",
    'audience', m."audience"::text,
    'titleBn', m."titleBn",
    'titleEn', m."titleEn",
    'descriptionBn', m."descriptionBn",
    'descriptionEn', m."descriptionEn",
    'writtenBn', m."writtenBn",
    'writtenEn', m."writtenEn",
    'videoId', m."videoId",
    'mustWatch', m."mustWatch",
    'attemptsAllowed', m."attemptsAllowed",
    'paragraphApprovalRequired', m."paragraphApprovalRequired",
    'passMark', m."passMark",
    'steps', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s."id",
        'type', s."type"::text,
        'promptBn', s."promptBn",
        'promptEn', s."promptEn",
        'options', s."options",
        'correctOptionId', s."correctOptionId",
        'correctOptionIds', s."correctOptionIds",
        'minWords', s."minWords",
        'explanationBn', s."explanationBn",
        'explanationEn', s."explanationEn",
        'points', s."points"
      ) ORDER BY s."order")
      FROM "Step" s WHERE s."moduleId" = m."id" AND s."archivedAt" IS NULL
    ), '[]'::jsonb)
  ),
  m."updatedAt",
  CASE WHEN m."published" THEN m."updatedAt" ELSE NULL END
FROM "Module" m;

UPDATE "StepProgress" sp
SET "contentVersionId" = v."id"
FROM "ModuleContentVersion" v
WHERE sp."moduleId" = v."moduleId";

