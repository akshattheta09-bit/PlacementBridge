ALTER TABLE "Announcement" ADD COLUMN "fixtureArchived" BOOLEAN NOT NULL DEFAULT false;

-- Retain the exact records and audit history created by the former smoke script.
UPDATE "Announcement"
SET "fixtureArchived" = true
WHERE "institutionId" = 'demo-institution'
  AND "source" = 'Synthetic memo PB-001'
  AND "summary" = 'Fictional schedule update for demonstration.'
  AND "content" = 'This fictional schedule does not describe an actual event.'
  AND "title" ~ '^Synthetic schedule [0-9]{13}( correction)?$';
