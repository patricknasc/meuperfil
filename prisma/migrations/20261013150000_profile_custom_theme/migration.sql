-- AlterEnum
ALTER TYPE "ProfileTheme" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "themeSettings" JSONB;
