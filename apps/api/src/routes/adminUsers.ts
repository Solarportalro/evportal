import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  changeAdminUserRole,
  disableAdminUser,
  enableAdminUser,
  getAdminUser,
  listAdminUsers,
  updateAdminUser
} from "../modules/admin-users/service.js";

export const adminUsersRouter = Router();

const listQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === "true";
    }),
  search: z.string().trim().optional()
});

const updateSchema = z.object({
  preferredLanguage: z.string().trim().min(2).max(10).optional(),
  isEmailVerified: z.boolean().optional(),
  isPhoneVerified: z.boolean().optional()
});

const disableSchema = z.object({
  reason: z.string().trim().max(2000).optional().nullable()
});

const roleSchema = z.object({
  role: z.nativeEnum(UserRole),
  adminNote: z.string().trim().max(2000).optional().nullable()
});

adminUsersRouter.use(requireAuth);

adminUsersRouter.get("/", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ users: await listAdminUsers(request.user, listQuerySchema.parse(request.query)) }));
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.get("/:userId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ user: await getAdminUser(request.user, request.params.userId) }));
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.patch("/:userId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(
      successResponse({
        user: await updateAdminUser(request.user, request.params.userId, updateSchema.parse(request.body))
      })
    );
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.patch("/:userId/disable", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(
      successResponse({
        user: await disableAdminUser(request.user, request.params.userId, disableSchema.parse(request.body))
      })
    );
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.patch("/:userId/enable", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ user: await enableAdminUser(request.user, request.params.userId) }));
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.patch("/:userId/role", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(
      successResponse({
        user: await changeAdminUserRole(request.user, request.params.userId, roleSchema.parse(request.body))
      })
    );
  } catch (error) {
    next(error);
  }
});
