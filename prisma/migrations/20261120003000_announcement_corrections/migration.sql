-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "correctionOfId" TEXT,
ADD COLUMN     "publisherName" TEXT,
ADD COLUMN     "studentAction" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_institutionId_id_key" ON "Announcement"("institutionId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_institutionId_correctionOfId_key" ON "Announcement"("institutionId", "correctionOfId");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_institutionId_correctionOfId_fkey" FOREIGN KEY ("institutionId", "correctionOfId") REFERENCES "Announcement"("institutionId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
