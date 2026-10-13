-- CreateEnum
CREATE TYPE "ProfileTheme" AS ENUM ('MODERN_DARK', 'NEON_CYAN', 'AURORA_PURPLE', 'MINIMAL_LIGHT', 'SUNSET_ORANGE', 'EMERALD_CLEAN', 'MIDNIGHT_VELVET', 'OCEAN_GRADIENT');

-- CreateEnum
CREATE TYPE "ProfileBlockType" AS ENUM ('LINK', 'TEXT_DIVIDER', 'SOCIAL_LINKS');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "theme" "ProfileTheme" NOT NULL DEFAULT 'MODERN_DARK',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "customDomain" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileBlock" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "ProfileBlockType" NOT NULL DEFAULT 'LINK',
    "title" TEXT,
    "url" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileVisit" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileBlockClick" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileBlockClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_handle_key" ON "Profile"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_customDomain_key" ON "Profile"("customDomain");

-- CreateIndex
CREATE INDEX "Profile_workspaceId_idx" ON "Profile"("workspaceId");

-- CreateIndex
CREATE INDEX "Profile_handle_idx" ON "Profile"("handle");

-- CreateIndex
CREATE INDEX "ProfileBlock_profileId_idx" ON "ProfileBlock"("profileId");

-- CreateIndex
CREATE INDEX "ProfileBlock_sortOrder_idx" ON "ProfileBlock"("sortOrder");

-- CreateIndex
CREATE INDEX "ProfileVisit_profileId_idx" ON "ProfileVisit"("profileId");

-- CreateIndex
CREATE INDEX "ProfileVisit_workspaceId_idx" ON "ProfileVisit"("workspaceId");

-- CreateIndex
CREATE INDEX "ProfileVisit_createdAt_idx" ON "ProfileVisit"("createdAt");

-- CreateIndex
CREATE INDEX "ProfileVisit_profileId_createdAt_idx" ON "ProfileVisit"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileBlockClick_profileId_idx" ON "ProfileBlockClick"("profileId");

-- CreateIndex
CREATE INDEX "ProfileBlockClick_blockId_idx" ON "ProfileBlockClick"("blockId");

-- CreateIndex
CREATE INDEX "ProfileBlockClick_workspaceId_idx" ON "ProfileBlockClick"("workspaceId");

-- CreateIndex
CREATE INDEX "ProfileBlockClick_createdAt_idx" ON "ProfileBlockClick"("createdAt");

-- CreateIndex
CREATE INDEX "ProfileBlockClick_profileId_createdAt_idx" ON "ProfileBlockClick"("profileId", "createdAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileBlock" ADD CONSTRAINT "ProfileBlock_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVisit" ADD CONSTRAINT "ProfileVisit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileBlockClick" ADD CONSTRAINT "ProfileBlockClick_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileBlockClick" ADD CONSTRAINT "ProfileBlockClick_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "ProfileBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
