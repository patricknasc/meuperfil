CREATE TABLE "BetaWaitlistEntry" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "goal" TEXT,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BetaWaitlistEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BetaWaitlistEntry_email_key" ON "BetaWaitlistEntry"("email");
