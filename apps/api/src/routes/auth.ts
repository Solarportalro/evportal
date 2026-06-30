import { CompanyType, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  getUserById,
  isPrismaUniqueError,
  loginUser,
  logoutWithRefreshToken,
  refreshAccessToken,
  registerCompany,
  registerUser,
  requestSetPassword,
  setPassword
} from "../modules/auth/service.js";

export const authRouter = Router();

const registerSchema = z.object({
  fullName: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).optional(),
  preferredLanguage: z.string().trim().min(2).max(10).optional()
});

const companyProfileSchema = z.object({
  publicName: z.string().trim().min(1),
  legalName: z.string().trim().optional().nullable(),
  type: z.nativeEnum(CompanyType),
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

const registerCompanySchema = z.object({
  fullName: z.string().trim().optional().nullable(),
  email: z.string().trim().min(1),
  phone: z.string().trim().optional().nullable(),
  password: z.string().min(8),
  preferredLanguage: z.string().trim().min(2).max(10).optional(),
  company: companyProfileSchema
});

const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(1),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

const requestSetPasswordSchema = z.object({
  emailOrPhone: z.string().trim().min(1)
});

const setPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
});

authRouter.post("/register", async (request, response, next) => {
  try {
    const result = await registerUser(registerSchema.parse(request.body));
    response.status(201).json(successResponse(result));
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      next(new AppError("User already exists", 409, "USER_EXISTS"));
      return;
    }

    next(error);
  }
});

authRouter.post("/register-company", async (request, response, next) => {
  try {
    const result = await registerCompany(registerCompanySchema.parse(request.body));
    response.status(201).json(successResponse(result));
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      next(new AppError("User already exists", 409, "USER_EXISTS"));
      return;
    }

    next(error);
  }
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const result = await loginUser(loginSchema.parse(request.body));
    response.json(successResponse(result));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (request, response, next) => {
  try {
    const result = await refreshAccessToken(refreshSchema.parse(request.body).refreshToken);
    response.json(successResponse(result));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (request, response, next) => {
  try {
    await logoutWithRefreshToken(logoutSchema.parse(request.body).refreshToken);
    response.json(successResponse({ loggedOut: true }));
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ user: await getUserById(request.user.id) }));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/request-set-password", async (request, response, next) => {
  try {
    const token = await requestSetPassword(requestSetPasswordSchema.parse(request.body).emailOrPhone);
    response.json(
      successResponse({
        requested: true,
        devSetPasswordToken: config.NODE_ENV === "production" ? undefined : token
      })
    );
  } catch (error) {
    next(error);
  }
});

authRouter.post("/set-password", async (request, response, next) => {
  try {
    await setPassword(setPasswordSchema.parse(request.body));
    response.json(successResponse({ passwordSet: true }));
  } catch (error) {
    next(error);
  }
});
