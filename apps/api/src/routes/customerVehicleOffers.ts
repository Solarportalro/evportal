import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { getCustomerOffer, listCustomerOffersForRequest, selectCustomerOffer } from "../modules/vehicle-offers/service.js";

export const customerVehicleOffersRouter = Router();

customerVehicleOffersRouter.use(requireAuth);

const selectOfferSchema = z.object({
  confirmContactReveal: z.boolean()
});

customerVehicleOffersRouter.get("/vehicle-requests/:requestId/offers", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleOffers: await listCustomerOffersForRequest(request.user, request.params.requestId) }));
  } catch (error) {
    next(error);
  }
});

customerVehicleOffersRouter.get("/vehicle-offers/:offerId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleOffer: await getCustomerOffer(request.user, request.params.offerId) }));
  } catch (error) {
    next(error);
  }
});

customerVehicleOffersRouter.post("/vehicle-offers/:offerId/select", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(
      successResponse(await selectCustomerOffer(request.user, request.params.offerId, selectOfferSchema.parse(request.body)))
    );
  } catch (error) {
    next(error);
  }
});
