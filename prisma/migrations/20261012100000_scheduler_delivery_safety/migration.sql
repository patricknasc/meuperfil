ALTER TABLE "ScheduledPost" ADD COLUMN "queueVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ScheduledPost" ADD COLUMN "publishAttemptedAt" TIMESTAMP(3);
