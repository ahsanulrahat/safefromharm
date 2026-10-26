-- Pin learners who have started a module to the immutable content snapshot
-- they began with. New learners will receive the latest published snapshot.
ALTER TABLE "ModuleProgress"
  ADD COLUMN "contentVersionId" TEXT;

-- Freeze the effective pass mark in the original published snapshots so a
-- later global setting change cannot silently recalculate existing learners.
UPDATE "ModuleContentVersion" version
SET "snapshot" = jsonb_set(
  version."snapshot",
  '{passMark}',
  to_jsonb(COALESCE(version."snapshot"->>'passMark', (
    SELECT CASE
      WHEN setting."value" ~ '^[0-9]+$' AND setting."value"::INTEGER BETWEEN 0 AND 100
        THEN setting."value"
      ELSE '70'
    END
    FROM "Setting" setting
    WHERE setting."key" = 'mcqPassMark'
  ), '70')::INTEGER),
  TRUE
)
WHERE version."version" = 1
  AND version."status" = 'PUBLISHED'
  AND version."snapshot"->>'passMark' IS NULL;

UPDATE "ModuleProgress" progress
SET "contentVersionId" = version."id"
FROM "ModuleContentVersion" version
WHERE progress."moduleId" = version."moduleId"
  AND version."version" = 1;

-- Legacy scoring stored question progress before a module-level progress row
-- existed. Create the missing started rows so those learners also stay pinned.
INSERT INTO "ModuleProgress" ("id", "participantId", "moduleId", "startedAt", "contentVersionId")
SELECT
  'pin-' || md5(progress."participantId" || ':' || progress."moduleId"),
  progress."participantId",
  progress."moduleId",
  MIN(progress."completedAt"),
  (ARRAY_AGG(progress."contentVersionId" ORDER BY progress."completedAt" ASC))[1]
FROM "StepProgress" progress
WHERE progress."contentVersionId" IS NOT NULL
GROUP BY progress."participantId", progress."moduleId"
ON CONFLICT ("participantId", "moduleId") DO NOTHING;

ALTER TABLE "ModuleProgress"
  ADD CONSTRAINT "ModuleProgress_contentVersionId_fkey"
  FOREIGN KEY ("contentVersionId") REFERENCES "ModuleContentVersion"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ModuleProgress_contentVersionId_idx"
  ON "ModuleProgress"("contentVersionId");
