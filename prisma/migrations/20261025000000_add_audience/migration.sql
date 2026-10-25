-- Replace the legacy section taxonomy with the current Rover/Leader audiences.
-- Existing non-leader Scout sections are grouped into Rover because the current
-- registration flow supports only Rover and Leader participants.
CREATE TYPE "Audience" AS ENUM ('ROVER', 'LEADER');

ALTER TABLE "Participant" ADD COLUMN "audience" "Audience";
ALTER TABLE "Module" ADD COLUMN "audience" "Audience";

UPDATE "Participant"
SET "audience" = CASE
  WHEN "section"::text = 'LEADER' THEN 'LEADER'::"Audience"
  ELSE 'ROVER'::"Audience"
END;

-- Legacy modules were shared by all participants; keep their history and make
-- them available to the current Rover audience.
UPDATE "Module" SET "audience" = 'ROVER'::"Audience";

ALTER TABLE "Participant" ALTER COLUMN "audience" SET NOT NULL;
ALTER TABLE "Module" ALTER COLUMN "audience" SET NOT NULL;

DROP INDEX "Participant_section_idx";
ALTER TABLE "Participant" DROP COLUMN "section";
DROP TYPE "Section";

CREATE INDEX "Participant_audience_idx" ON "Participant"("audience");
CREATE INDEX "Module_audience_order_idx" ON "Module"("audience", "order");
