import { VehicleFuelType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  getAdminCompaniesReport,
  getAdminDemandReport,
  getAdminFunnelReport,
  getAdminOffersReport,
  getAdminOverviewReport,
  getAdminSolarEvReport,
  type AdminReportFilters
} from "../modules/admin-reports/service.js";

export const adminReportsRouter = Router();

const dateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, context) => {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date"
      });
      return z.NEVER;
    }

    return date;
  });

const filtersSchema = z
  .object({
    dateFrom: dateSchema,
    dateTo: dateSchema,
    fuelType: z.nativeEnum(VehicleFuelType).optional(),
    makeId: z.string().trim().optional(),
    modelId: z.string().trim().optional()
  })
  .superRefine((input, context) => {
    if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFrom"],
        message: "dateFrom must not be after dateTo"
      });
    }
  });

function parseFilters(query: unknown): AdminReportFilters {
  const filters = filtersSchema.parse(query);

  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    fuelType: filters.fuelType,
    makeId: filters.makeId || undefined,
    modelId: filters.modelId || undefined
  };
}

adminReportsRouter.use(requireAuth);

adminReportsRouter.get("/overview", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ overview: await getAdminOverviewReport(request.user, parseFilters(request.query)) }));
  } catch (error) {
    next(error);
  }
});

adminReportsRouter.get("/funnel", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ funnel: await getAdminFunnelReport(request.user, parseFilters(request.query)) }));
  } catch (error) {
    next(error);
  }
});

adminReportsRouter.get("/demand", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ demand: await getAdminDemandReport(request.user, parseFilters(request.query)) }));
  } catch (error) {
    next(error);
  }
});

adminReportsRouter.get("/offers", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ offers: await getAdminOffersReport(request.user, parseFilters(request.query)) }));
  } catch (error) {
    next(error);
  }
});

adminReportsRouter.get("/companies", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ companies: await getAdminCompaniesReport(request.user, parseFilters(request.query)) }));
  } catch (error) {
    next(error);
  }
});

adminReportsRouter.get("/solar-ev", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ solarEv: await getAdminSolarEvReport(request.user, parseFilters(request.query)) }));
  } catch (error) {
    next(error);
  }
});
