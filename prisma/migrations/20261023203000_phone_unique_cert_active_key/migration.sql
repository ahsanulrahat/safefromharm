-- Enforce unique phone numbers at the database level.
CREATE UNIQUE INDEX "Participant_phone_key" ON "Participant"("phone");

-- One active certificate per participant; revoked rows have NULL activeKey.
ALTER TABLE "Certificate" ADD COLUMN "activeKey" TEXT;

CREATE UNIQUE INDEX "Certificate_activeKey_key" ON "Certificate"("activeKey");
