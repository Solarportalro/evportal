-- CreateEnum
CREATE TYPE "VehicleFuelType" AS ENUM ('ELECTRIC', 'PLUG_IN_HYBRID', 'HYBRID', 'GASOLINE', 'DIESEL');

-- CreateEnum
CREATE TYPE "VehicleRequestMode" AS ENUM ('EXACT_MODEL', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "VehicleRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACTIVE', 'OFFERS_RECEIVED', 'CUSTOMER_DECIDING', 'COMPANY_SELECTED', 'CLOSED_SUCCESSFULLY', 'CLOSED_WITHOUT_PURCHASE', 'EXPIRED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VehicleBodyType" AS ENUM ('SMALL_HATCHBACK', 'SEDAN', 'SUV_CROSSOVER', 'VAN_BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "StockImportPreference" AS ENUM ('IN_STOCK_ONLY', 'IMPORT_OK', 'BOTH', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "PurchaseTimeline" AS ENUM ('ASAP', 'ONE_TO_THREE_MONTHS', 'JUST_EXPLORING');

-- CreateEnum
CREATE TYPE "HasSolar" AS ENUM ('YES', 'NO', 'PLANNING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SolarChargingInterest" AS ENUM ('YES', 'MAYBE_LATER', 'NO', 'NOT_ASKED');

-- CreateTable
CREATE TABLE "VehicleRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestMode" "VehicleRequestMode" NOT NULL,
    "status" "VehicleRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "fuelType" "VehicleFuelType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "preferredYearFrom" INTEGER,
    "preferredYearTo" INTEGER,
    "bodyType" "VehicleBodyType",
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "desiredRangeKm" INTEGER,
    "stockImportPreference" "StockImportPreference" NOT NULL,
    "purchaseTimeline" "PurchaseTimeline" NOT NULL,
    "hasSolar" "HasSolar" NOT NULL,
    "solarChargingInterest" "SolarChargingInterest" NOT NULL DEFAULT 'NOT_ASKED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleRequest_customerId_idx" ON "VehicleRequest"("customerId");

-- CreateIndex
CREATE INDEX "VehicleRequest_status_idx" ON "VehicleRequest"("status");

-- CreateIndex
CREATE INDEX "VehicleRequest_fuelType_idx" ON "VehicleRequest"("fuelType");

-- CreateIndex
CREATE INDEX "VehicleRequest_createdAt_idx" ON "VehicleRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "VehicleRequest" ADD CONSTRAINT "VehicleRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
