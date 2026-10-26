-- Keep inherited pass marks separate from the content snapshot. A learner's
-- pinned version keeps its effective rule, while future versions can continue
-- inheriting the global default.
ALTER TABLE "ModuleContentVersion"
  ADD COLUMN "effectivePassMark" INTEGER NOT NULL DEFAULT 70;

UPDATE "ModuleContentVersion" version
SET "effectivePassMark" = CASE
  WHEN version."snapshot"->>'passMark' ~ '^(0|[1-9][0-9]?|100)$'
    THEN (version."snapshot"->>'passMark')::INTEGER
  ELSE COALESCE((
    SELECT CASE
      WHEN setting."value" ~ '^(0|[1-9][0-9]?|100)$' THEN setting."value"::INTEGER
      ELSE 70
    END
    FROM "Setting" setting
    WHERE setting."key" = 'mcqPassMark'
  ), 70)
END;

-- Migration 3 froze the legacy effective value into baseline snapshots. Put
-- the module's authored override back in the snapshot (null means inherit).
UPDATE "ModuleContentVersion" version
SET "snapshot" = jsonb_set(
  version."snapshot",
  '{passMark}',
  COALESCE(to_jsonb(module."passMark"), 'null'::jsonb),
  TRUE
)
FROM "Module" module
WHERE version."moduleId" = module."id"
  AND version."version" = 1
  AND version."status" = 'PUBLISHED';
