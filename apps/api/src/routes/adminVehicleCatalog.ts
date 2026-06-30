import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  createMake,
  createModel,
  listAdminMakes,
  listAdminModels,
  setMakeActive,
  setModelActive,
  updateMake,
  updateModel
} from "../modules/admin-vehicle-catalog/service.js";

export const adminVehicleCatalogRouter = Router();

const adminRoles = [UserRole.PLATFORM_ADMIN, UserRole.SUPPORT];

const nameSchema = z.object({
  name: z.string().trim().min(1)
});

adminVehicleCatalogRouter.use(requireAuth, requireRole(adminRoles));

adminVehicleCatalogRouter.get("/makes", async (_request, response, next) => {
  try {
    response.json(successResponse({ makes: await listAdminMakes() }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.post("/makes", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    const make = await createMake(request.user, nameSchema.parse(request.body));
    response.status(201).json(successResponse({ make }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.patch("/makes/:makeId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ make: await updateMake(request.user, request.params.makeId, nameSchema.parse(request.body)) }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.patch("/makes/:makeId/activate", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ make: await setMakeActive(request.user, request.params.makeId, true) }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.patch("/makes/:makeId/deactivate", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ make: await setMakeActive(request.user, request.params.makeId, false) }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.get("/makes/:makeId/models", async (request, response, next) => {
  try {
    response.json(successResponse({ models: await listAdminModels(request.params.makeId) }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.post("/makes/:makeId/models", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    const model = await createModel(request.user, request.params.makeId, nameSchema.parse(request.body));
    response.status(201).json(successResponse({ model }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.patch("/models/:modelId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ model: await updateModel(request.user, request.params.modelId, nameSchema.parse(request.body)) }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.patch("/models/:modelId/activate", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ model: await setModelActive(request.user, request.params.modelId, true) }));
  } catch (error) {
    next(error);
  }
});

adminVehicleCatalogRouter.patch("/models/:modelId/deactivate", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ model: await setModelActive(request.user, request.params.modelId, false) }));
  } catch (error) {
    next(error);
  }
});
