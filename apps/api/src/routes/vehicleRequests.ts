import {
  HasSolar,
  PurchaseTimeline,
  SolarChargingInterest,
  StockImportPreference,
  VehicleBodyType,
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

const createVehicleRequestSchema = z
  .object({
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
    notes: z.string().trim().max(2000).optional().nullable()
  })
  .superRefine((input, context) => {
    if (input.budgetMin && input.budgetMax && input.budgetMin > input.budgetMax) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMin"],
        message: "budgetMin must not exceed budgetMax"
      });
    }

    if (input.preferredYearFrom && input.preferredYearTo && input.preferredYearFrom > input.preferredYearTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preferredYearFrom"],
        message: "preferredYearFrom must not exceed preferredYearTo"
      });
    }

    if (input.requestMode === VehicleRequestMode.EXACT_MODEL) {
      const hasCatalogVehicle = Boolean(input.makeId?.trim() && input.modelId?.trim());
      const hasManualVehicle = Boolean(input.manualMake?.trim() && input.manualModel?.trim());

      if (!hasCatalogVehicle && !hasManualVehicle) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["makeId"],
          message: "Exact-model requests require either catalog make/model or manual make/model"
        });
      }

      if ((input.makeId?.trim() && !input.modelId?.trim()) || (!input.makeId?.trim() && input.modelId?.trim())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["modelId"],
          message: "Both makeId and modelId are required when using catalog selection"
        });
      }

      if ((input.manualMake?.trim() && !input.manualModel?.trim()) || (!input.manualMake?.trim() && input.manualModel?.trim())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manualModel"],
          message: "Both manualMake and manualModel are required when using manual selection"
        });
      }
    }

    if (input.requestMode === VehicleRequestMode.RECOMMENDATION) {
      if (!input.budgetMin && !input.budgetMax) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["budgetMin"],
          message: "budgetMin or budgetMax is required for recommendation requests"
        });
      }

      if (!input.bodyType) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bodyType"],
          message: "bodyType is required for recommendation requests"
        });
      }
    }
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
