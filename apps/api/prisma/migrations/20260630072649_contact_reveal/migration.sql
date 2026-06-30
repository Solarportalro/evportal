-- CreateTable
CREATE TABLE "ContactReveal" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "revealedToUserId" TEXT,
    "consentText" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReveal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactReveal_requestId_key" ON "ContactReveal"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactReveal_offerId_key" ON "ContactReveal"("offerId");

-- CreateIndex
CREATE INDEX "ContactReveal_offerId_idx" ON "ContactReveal"("offerId");

-- CreateIndex
CREATE INDEX "ContactReveal_companyId_idx" ON "ContactReveal"("companyId");

-- CreateIndex
CREATE INDEX "ContactReveal_customerId_idx" ON "ContactReveal"("customerId");

-- CreateIndex
CREATE INDEX "ContactReveal_createdAt_idx" ON "ContactReveal"("createdAt");

-- AddForeignKey
ALTER TABLE "ContactReveal" ADD CONSTRAINT "ContactReveal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VehicleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReveal" ADD CONSTRAINT "ContactReveal_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "VehicleOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReveal" ADD CONSTRAINT "ContactReveal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReveal" ADD CONSTRAINT "ContactReveal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReveal" ADD CONSTRAINT "ContactReveal_revealedToUserId_fkey" FOREIGN KEY ("revealedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
