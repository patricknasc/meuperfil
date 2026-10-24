-- AlterTable
ALTER TABLE "Automation" ADD COLUMN "endsAt" TIMESTAMP(3),
ADD COLUMN "typoTolerance" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DmLog" ADD COLUMN "mediaId" TEXT;
