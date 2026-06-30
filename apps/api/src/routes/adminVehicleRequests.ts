import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  getAdminVehicleRequest,
  listAdminVehicleRequests,
  transitionAdminVehicleRequest,
  vehicleRequestTransitions
} from "../modules/vehicle-requests/service.js";

export const adminVehicleRequestsRouter = Router();

const transitionSchema = z.object({
  adminNote: z.string().trim().max(2000).optional().nullable()
});

adminVehicleRequestsRouter.use(requireAuth);

adminVehicleRequestsRouter.get("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleRequests: await listAdminVehicleRequests(request.user) }));
  } catch (error) {
    next(error);
  }
});

adminVehicleRequestsRouter.get("/:requestId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleRequest: await getAdminVehicleRequest(request.user, request.params.requestId) }));
  } catch (error) {
    next(error);
  }
});

function transitionRoute(name: keyof typeof vehicleRequestTransitions) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      if (!request.user) {
        throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
      }

      response.json(
        successResponse({
          vehicleRequest: await transitionAdminVehicleRequest(
            request.user,
            String(request.params.requestId),
            vehicleRequestTransitions[name],
            transitionSchema.parse(request.body)
          )
        })
      );
    } catch (error) {
      next(error);
    }
  };
}

adminVehicleRequestsRouter.patch("/:requestId/approve", transitionRoute("approve"));
adminVehicleRequestsRouter.patch("/:requestId/reject", transitionRoute("reject"));
adminVehicleRequestsRouter.patch("/:requestId/cancel", transitionRoute("cancel"));
adminVehicleRequestsRouter.patch("/:requestId/expire", transitionRoute("expire"));
adminVehicleRequestsRouter.patch("/:requestId/close-successfully", transitionRoute("closeSuccessfully"));
adminVehicleRequestsRouter.patch("/:requestId/close-without-purchase", transitionRoute("closeWithoutPurchase"));
