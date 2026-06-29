import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { prisma } from "../prisma.js";
import { errorResponse } from "../apiResponse.js";
import { verifyAccessToken } from "../utils/jwt.js";

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    response.status(401).json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      response.status(401).json(errorResponse("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    request.user = user;
    next();
  } catch {
    response.status(401).json(errorResponse("Invalid access token", "INVALID_ACCESS_TOKEN"));
  }
}

export function requireRole(roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      response.status(401).json(errorResponse("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    if (!roles.includes(request.user.role)) {
      response.status(403).json(errorResponse("Forbidden", "FORBIDDEN"));
      return;
    }

    next();
  };
}
