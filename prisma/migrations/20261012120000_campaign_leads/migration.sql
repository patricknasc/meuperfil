CREATE TYPE "LeadSource" AS ENUM ('BIO_LINK', 'INSTAGRAM_DM', 'CAMPAIGN', 'MANUAL', 'IMPORT');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');
CREATE TABLE "Contact" (
  "id" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "identityKey" TEXT NOT NULL,
  "name" TEXT, "email" TEXT, "phone" TEXT, "instagramUsername" TEXT, "instagramId" TEXT,
  "source" "LeadSource" NOT NULL, "sourceId" TEXT, "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "customFields" JSONB,
  "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LeadInteraction" (
  "id" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "contactId" TEXT NOT NULL, "automationId" TEXT,
  "eventKey" TEXT NOT NULL, "source" "LeadSource" NOT NULL, "sourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadInteraction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Contact_workspaceId_identityKey_key" ON "Contact"("workspaceId", "identityKey");
CREATE INDEX "Contact_workspaceId_status_idx" ON "Contact"("workspaceId", "status");
CREATE INDEX "Contact_workspaceId_lastInteractionAt_idx" ON "Contact"("workspaceId", "lastInteractionAt");
CREATE UNIQUE INDEX "LeadInteraction_eventKey_key" ON "LeadInteraction"("eventKey");
CREATE INDEX "LeadInteraction_workspaceId_automationId_idx" ON "LeadInteraction"("workspaceId", "automationId");
CREATE INDEX "LeadInteraction_contactId_createdAt_idx" ON "LeadInteraction"("contactId", "createdAt");
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadInteraction" ADD CONSTRAINT "LeadInteraction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadInteraction" ADD CONSTRAINT "LeadInteraction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadInteraction" ADD CONSTRAINT "LeadInteraction_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
