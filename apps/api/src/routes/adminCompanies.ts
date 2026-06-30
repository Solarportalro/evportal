import { CompanyType } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  companyStatusTransitions,
  getAdminCompany,
  listAdminCompanies,
  transitionAdminCompany,
  updateAdminCompany
} from "../modules/companies/service.js";

export const adminCompaniesRouter = Router();

const companyUpdateSchema = z.object({
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

const transitionSchema = z.object({
  adminNote: z.string().trim().max(2000).optional().nullable()
});

adminCompaniesRouter.use(requireAuth);

adminCompaniesRouter.get("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ companies: await listAdminCompanies(request.user) }));
  } catch (error) {
    next(error);
  }
});

adminCompaniesRouter.get("/:companyId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ company: await getAdminCompany(request.user, request.params.companyId) }));
  } catch (error) {
    next(error);
  }
});

adminCompaniesRouter.patch("/:companyId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(
      successResponse({
        company: await updateAdminCompany(request.user, request.params.companyId, companyUpdateSchema.parse(request.body))
      })
    );
  } catch (error) {
    next(error);
  }
});

function transitionRoute(name: keyof typeof companyStatusTransitions) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      if (!request.user) {
        throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
      }

      response.json(
        successResponse({
          company: await transitionAdminCompany(
            request.user,
            String(request.params.companyId),
            companyStatusTransitions[name],
            transitionSchema.parse(request.body)
          )
        })
      );
    } catch (error) {
      next(error);
    }
  };
}

adminCompaniesRouter.patch("/:companyId/approve", transitionRoute("approve"));
adminCompaniesRouter.patch("/:companyId/reject", transitionRoute("reject"));
adminCompaniesRouter.patch("/:companyId/suspend", transitionRoute("suspend"));
adminCompaniesRouter.patch("/:companyId/reactivate", transitionRoute("reactivate"));
