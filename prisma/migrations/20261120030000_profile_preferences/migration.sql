CREATE TYPE "StartPage" AS ENUM ('overview', 'announcements', 'corrections', 'review', 'cases', 'accounts');

ALTER TABLE "User"
ADD COLUMN "preferredName" TEXT,
ADD COLUMN "startPage" "StartPage" NOT NULL DEFAULT 'overview';
