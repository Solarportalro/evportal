import { Router } from "express";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { getAdminContactReveal, listAdminContactReveals } from "../modules/vehicle-offers/service.js";

export const adminContactRevealsRouter = Router();

adminContactRevealsRouter.use(requireAuth);

adminContactRevealsRouter.get("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ contactReveals: await listAdminContactReveals(request.user) }));
  } catch (error) {
    next(error);
  }
});

adminContactRevealsRouter.get("/:revealId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ contactReveal: await getAdminContactReveal(request.user, request.params.revealId) }));
  } catch (error) {
    next(error);
  }
});
