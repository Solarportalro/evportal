import type { UserRole } from "@prisma/client";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
};

export function createAccessToken(input: { userId: string; role: UserRole }): string {
  return jwt.sign(
    {
      sub: input.userId,
      role: input.role,
      type: "access"
    },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] }
  );
}

export function createRefreshToken(input: { userId: string }): string {
  return jwt.sign(
    {
      sub: input.userId,
      type: "refresh"
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;

  if (payload.type !== "access" || typeof payload.sub !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid access token");
  }

  return {
    sub: payload.sub,
    role: payload.role as UserRole,
    type: "access"
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;

  if (payload.type !== "refresh" || typeof payload.sub !== "string") {
    throw new Error("Invalid refresh token");
  }

  return {
    sub: payload.sub,
    type: "refresh"
  };
}
