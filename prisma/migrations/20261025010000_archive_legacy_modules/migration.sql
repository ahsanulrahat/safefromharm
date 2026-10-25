-- Keep the legacy module and progress records for reporting, but remove the
-- shared curriculum from the current audience-specific course flow.
UPDATE "Module"
SET "published" = false
WHERE "slug" IN (
  'understanding-harm',
  'responding-safely',
  'reporting-concerns'
);
