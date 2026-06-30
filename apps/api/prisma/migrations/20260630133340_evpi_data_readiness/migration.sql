-- CreateEnum
CREATE TYPE "VehicleConditionPreference" AS ENUM ('NEW', 'USED', 'ANY', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "FinancingInterest" AS ENUM ('CASH', 'FINANCING', 'LEASING', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "ChargerNeed" AS ENUM ('YES', 'NO', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('NEW', 'USED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SourceMarket" AS ENUM ('ARMENIA', 'CHINA', 'EUROPE', 'USA', 'KOREA', 'JAPAN', 'UAE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ChargingPortType" AS ENUM ('CCS2', 'GBT', 'TYPE2', 'TESLA_NACS', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BatteryChemistry" AS ENUM ('LFP', 'NMC', 'UNKNOWN');

-- AlterTable
ALTER TABLE "VehicleOffer" ADD COLUMN     "acChargingKw" DOUBLE PRECISION,
ADD COLUMN     "accidentHistoryDeclared" TEXT,
ADD COLUMN     "batteryChemistry" "BatteryChemistry" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "chargingPortType" "ChargingPortType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "condition" "VehicleCondition" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "dcFastChargingKw" DOUBLE PRECISION,
ADD COLUMN     "documentsAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "driveType" TEXT,
ADD COLUMN     "inspectionIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photosAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceMarket" "SourceMarket" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "vinAvailable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VehicleRequest" ADD COLUMN     "chargerNeeded" "ChargerNeed" NOT NULL DEFAULT 'NOT_SURE',
ADD COLUMN     "chargingAccess" TEXT,
ADD COLUMN     "conditionPreference" "VehicleConditionPreference" NOT NULL DEFAULT 'NOT_SURE',
ADD COLUMN     "customerCity" TEXT,
ADD COLUMN     "customerRegion" TEXT,
ADD COLUMN     "financingInterest" "FinancingInterest" NOT NULL DEFAULT 'NOT_SURE',
ADD COLUMN     "maxMileageKm" INTEGER,
ADD COLUMN     "tradeInInterest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usageType" TEXT;

-- CreateIndex
CREATE INDEX "VehicleOffer_condition_idx" ON "VehicleOffer"("condition");

-- CreateIndex
CREATE INDEX "VehicleOffer_sourceMarket_idx" ON "VehicleOffer"("sourceMarket");

-- CreateIndex
CREATE INDEX "VehicleOffer_chargingPortType_idx" ON "VehicleOffer"("chargingPortType");

-- CreateIndex
CREATE INDEX "VehicleOffer_batteryChemistry_idx" ON "VehicleOffer"("batteryChemistry");

-- CreateIndex
CREATE INDEX "VehicleRequest_conditionPreference_idx" ON "VehicleRequest"("conditionPreference");

-- CreateIndex
CREATE INDEX "VehicleRequest_financingInterest_idx" ON "VehicleRequest"("financingInterest");

-- CreateIndex
CREATE INDEX "VehicleRequest_chargerNeeded_idx" ON "VehicleRequest"("chargerNeeded");

-- CreateIndex
CREATE INDEX "VehicleRequest_customerRegion_idx" ON "VehicleRequest"("customerRegion");
