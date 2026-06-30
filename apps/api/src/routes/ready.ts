import { Router } from "express";
import { errorResponse, successResponse } from "../apiResponse.js";
import { prisma } from "../prisma.js";

export const readyRouter = Router();

readyRouter.get("/", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.json(
      successResponse({
        status: "ready",
        database: "ok"
      })
    );
  } catch {
    response.status(503).json(errorResponse("Service unavailable", "SERVICE_UNAVAILABLE"));
  }
});
