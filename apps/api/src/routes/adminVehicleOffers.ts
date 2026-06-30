import { Router } from "express";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { getAdminOffer, listAdminOffers } from "../modules/vehicle-offers/service.js";

export const adminVehicleOffersRouter = Router();

adminVehicleOffersRouter.use(requireAuth);

adminVehicleOffersRouter.get("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleOffers: await listAdminOffers(request.user) }));
  } catch (error) {
    next(error);
  }
});

adminVehicleOffersRouter.get("/:offerId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleOffer: await getAdminOffer(request.user, request.params.offerId) }));
  } catch (error) {
    next(error);
  }
});
