import {
  HasSolar,
  ChargerNeed,
  FinancingInterest,
  PurchaseTimeline,
  SolarChargingInterest,
  StockImportPreference,
  VehicleBodyType,
  VehicleConditionPreference,
  VehicleFuelType,
  VehicleRequestMode
} from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  createVehicleRequest,
  getVehicleRequest,
  listVehicleRequests
} from "../modules/vehicle-requests/service.js";

export const vehicleRequestsRouter = Router();

const currentYear = new Date().getFullYear();

export const createVehicleRequestSchema = z.object({
  requestMode: z.nativeEnum(VehicleRequestMode),
  fuelType: z.nativeEnum(VehicleFuelType),
  makeId: z.string().trim().optional().nullable(),
  modelId: z.string().trim().optional().nullable(),
  manualMake: z.string().trim().optional().nullable(),
  manualModel: z.string().trim().optional().nullable(),
  preferredYearFrom: z.number().int().min(1990).max(currentYear + 2).optional().nullable(),
  preferredYearTo: z.number().int().min(1990).max(currentYear + 2).optional().nullable(),
  bodyType: z.nativeEnum(VehicleBodyType).optional().nullable(),
  budgetMin: z.number().int().positive().optional().nullable(),
  budgetMax: z.number().int().positive().optional().nullable(),
  desiredRangeKm: z.number().int().positive().optional().nullable(),
  stockImportPreference: z.nativeEnum(StockImportPreference),
  purchaseTimeline: z.nativeEnum(PurchaseTimeline),
  hasSolar: z.nativeEnum(HasSolar),
  solarChargingInterest: z.nativeEnum(SolarChargingInterest).optional(),
  conditionPreference: z.nativeEnum(VehicleConditionPreference).optional(),
  maxMileageKm: z.number().int().nonnegative().optional().nullable(),
  financingInterest: z.nativeEnum(FinancingInterest).optional(),
  tradeInInterest: z.boolean().optional(),
  chargerNeeded: z.nativeEnum(ChargerNeed).optional(),
  customerRegion: z.string().trim().max(120).optional().nullable(),
  customerCity: z.string().trim().max(120).optional().nullable(),
  usageType: z.string().trim().max(160).optional().nullable(),
  chargingAccess: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable()
});

vehicleRequestsRouter.use(requireAuth);

vehicleRequestsRouter.get("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleRequests: await listVehicleRequests(request.user) }));
  } catch (error) {
    next(error);
  }
});

vehicleRequestsRouter.post("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    const result = await createVehicleRequest(request.user, createVehicleRequestSchema.parse(request.body));
    response.status(201).json(successResponse({ vehicleRequest: result }));
  } catch (error) {
    next(error);
  }
});

vehicleRequestsRouter.get("/:id", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleRequest: await getVehicleRequest(request.user, request.params.id) }));
  } catch (error) {
    next(error);
  }
});
