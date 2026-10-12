ALTER TABLE "ScheduledPost" ADD COLUMN "quotaCountedAt" TIMESTAMP(3);
UPDATE "ScheduledPost" SET "quotaCountedAt" = "createdAt" WHERE "status" <> 'DRAFT';
