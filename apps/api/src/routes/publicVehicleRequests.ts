import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { createPublicVehicleRequest } from "../modules/vehicle-requests/service.js";
import { createVehicleRequestSchema } from "./vehicleRequests.js";

export const publicVehicleRequestsRouter = Router();

const publicVehicleRequestSchema = createVehicleRequestSchema.extend({
  fullName: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  preferredLanguage: z.string().trim().min(2).max(10).optional().nullable()
});

publicVehicleRequestsRouter.post("/vehicle-requests", async (request, response, next) => {
  try {
    const result = await createPublicVehicleRequest(publicVehicleRequestSchema.parse(request.body));
    response.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
});
