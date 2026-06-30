-- CreateEnum
CREATE TYPE "VehicleOfferType" AS ENUM ('IN_STOCK', 'IMPORT_ORDER', 'ALTERNATIVE_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "VehicleOfferStatus" AS ENUM ('SUBMITTED', 'UPDATED', 'WITHDRAWN', 'SELECTED', 'REJECTED_BY_CUSTOMER', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VehicleAvailabilityStatus" AS ENUM ('IN_ARMENIA', 'IN_TRANSIT', 'IMPORT_REQUIRED');

-- CreateEnum
CREATE TYPE "OfferCurrency" AS ENUM ('AMD', 'USD', 'EUR');

-- CreateTable
CREATE TABLE "VehicleOffer" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "offerType" "VehicleOfferType" NOT NULL,
    "status" "VehicleOfferStatus" NOT NULL DEFAULT 'SUBMITTED',
    "makeId" TEXT,
    "modelId" TEXT,
    "manualMake" TEXT,
    "manualModel" TEXT,
    "year" INTEGER,
    "trim" TEXT,
    "fuelType" "VehicleFuelType" NOT NULL,
    "batteryCapacityKwh" DOUBLE PRECISION,
    "rangeKm" INTEGER,
    "mileageKm" INTEGER,
    "color" TEXT,
    "availabilityStatus" "VehicleAvailabilityStatus" NOT NULL,
    "sourceCountry" TEXT,
    "estimatedDeliveryDaysMin" INTEGER,
    "estimatedDeliveryDaysMax" INTEGER,
    "priceAmount" INTEGER NOT NULL,
    "currency" "OfferCurrency" NOT NULL,
    "priceIncludesCustoms" BOOLEAN NOT NULL DEFAULT false,
    "priceIncludesRegistration" BOOLEAN NOT NULL DEFAULT false,
    "priceIncludesDeliveryToArmenia" BOOLEAN NOT NULL DEFAULT false,
    "priceIncludesDealerFee" BOOLEAN NOT NULL DEFAULT false,
    "priceIsFinal" BOOLEAN NOT NULL DEFAULT false,
    "advancePaymentRequired" BOOLEAN NOT NULL DEFAULT false,
    "advancePaymentAmount" INTEGER,
    "advancePaymentRefundable" BOOLEAN,
    "warrantyMonths" INTEGER,
    "batteryWarrantyMonths" INTEGER,
    "warrantyProvider" TEXT,
    "serviceSupportIncluded" BOOLEAN NOT NULL DEFAULT false,
    "chargerIncluded" BOOLEAN NOT NULL DEFAULT false,
    "financingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "tradeInAccepted" BOOLEAN NOT NULL DEFAULT false,
    "offerValidUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleOffer_requestId_idx" ON "VehicleOffer"("requestId");

-- CreateIndex
CREATE INDEX "VehicleOffer_companyId_idx" ON "VehicleOffer"("companyId");

-- CreateIndex
CREATE INDEX "VehicleOffer_submittedByUserId_idx" ON "VehicleOffer"("submittedByUserId");

-- CreateIndex
CREATE INDEX "VehicleOffer_status_idx" ON "VehicleOffer"("status");

-- CreateIndex
CREATE INDEX "VehicleOffer_offerType_idx" ON "VehicleOffer"("offerType");

-- CreateIndex
CREATE INDEX "VehicleOffer_createdAt_idx" ON "VehicleOffer"("createdAt");

-- CreateIndex
CREATE INDEX "VehicleOffer_makeId_idx" ON "VehicleOffer"("makeId");

-- CreateIndex
CREATE INDEX "VehicleOffer_modelId_idx" ON "VehicleOffer"("modelId");

-- AddForeignKey
ALTER TABLE "VehicleOffer" ADD CONSTRAINT "VehicleOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VehicleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleOffer" ADD CONSTRAINT "VehicleOffer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleOffer" ADD CONSTRAINT "VehicleOffer_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleOffer" ADD CONSTRAINT "VehicleOffer_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleOffer" ADD CONSTRAINT "VehicleOffer_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
