-- AlterTable
ALTER TABLE "ProfileBlockClick" ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "utmCampaign" TEXT,
ADD COLUMN "utmMedium" TEXT,
ADD COLUMN "utmSource" TEXT;

-- AlterTable
ALTER TABLE "ProfileVisit" ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "utmCampaign" TEXT,
ADD COLUMN "utmMedium" TEXT,
ADD COLUMN "utmSource" TEXT;
