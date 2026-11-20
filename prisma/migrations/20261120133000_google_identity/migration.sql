ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "authSubject" TEXT;
CREATE UNIQUE INDEX "User_authSubject_key" ON "User"("authSubject");
CREATE TABLE "RoleRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "role" "Role" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3)
);
CREATE INDEX "RoleRequest_status_createdAt_idx" ON "RoleRequest"("status", "createdAt");
CREATE UNIQUE INDEX "RoleRequest_one_pending_per_role" ON "RoleRequest"("userId", "role") WHERE "status" = 'PENDING';
INSERT INTO "Institution" ("id", "name")
VALUES ('prototype-institution', 'PlacementBridge prototype')
ON CONFLICT ("id") DO NOTHING;
