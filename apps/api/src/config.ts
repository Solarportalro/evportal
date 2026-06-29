import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    FRONTEND_URL: z.string().url().default("http://localhost:5173"),
    JWT_ACCESS_SECRET: z.string().min(16).optional(),
    JWT_REFRESH_SECRET: z.string().min(16).optional(),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    SET_PASSWORD_TOKEN_EXPIRES_IN: z.string().default("1h")
  })
  .transform((env) => ({
    ...env,
    JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me"
  }))
  .superRefine((env, context) => {
    if (env.NODE_ENV !== "production") {
      return;
    }

    if (env.JWT_ACCESS_SECRET === "dev-access-secret-change-me") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_ACCESS_SECRET"],
        message: "JWT_ACCESS_SECRET is required in production"
      });
    }

    if (env.JWT_REFRESH_SECRET === "dev-refresh-secret-change-me") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_REFRESH_SECRET"],
        message: "JWT_REFRESH_SECRET is required in production"
      });
    }
  });

export const config = envSchema.parse(process.env);
