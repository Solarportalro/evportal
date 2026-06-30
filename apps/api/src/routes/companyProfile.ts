import { CompanyType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { getOwnCompanyProfile, updateOwnCompanyProfile } from "../modules/companies/service.js";

export const companyProfileRouter = Router();

const companyProfileUpdateSchema = z.object({
  publicName: z.string().trim().min(1).optional(),
  legalName: z.string().trim().optional().nullable(),
  type: z.nativeEnum(CompanyType).optional(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  contactPersonName: z.string().trim().optional().nullable(),
  contactPersonPhone: z.string().trim().optional().nullable(),
  contactPersonEmail: z.string().trim().optional().nullable()
});

companyProfileRouter.use(requireAuth);

companyProfileRouter.get("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse(await getOwnCompanyProfile(request.user)));
  } catch (error) {
    next(error);
  }
});

companyProfileRouter.patch("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse(await updateOwnCompanyProfile(request.user, companyProfileUpdateSchema.parse(request.body))));
  } catch (error) {
    next(error);
  }
});
