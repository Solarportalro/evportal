import { Router } from "express";
import { successResponse } from "../apiResponse.js";
import { listActiveMakes, listActiveModels } from "../modules/vehicle-catalog/service.js";

export const vehicleCatalogRouter = Router();

vehicleCatalogRouter.get("/makes", async (_request, response, next) => {
  try {
    response.json(successResponse({ makes: await listActiveMakes() }));
  } catch (error) {
    next(error);
  }
});

vehicleCatalogRouter.get("/makes/:makeId/models", async (request, response, next) => {
  try {
    response.json(successResponse({ models: await listActiveModels(request.params.makeId) }));
  } catch (error) {
    next(error);
  }
});
