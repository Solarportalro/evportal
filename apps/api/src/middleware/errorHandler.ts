import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { errorResponse } from "../apiResponse.js";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = "INTERNAL_ERROR",
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json(errorResponse("Validation failed", "VALIDATION_ERROR", { issues: error.issues }));
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json(errorResponse(error.message, error.code, error.details));
    return;
  }

  response.status(500).json(errorResponse("Internal server error"));
};
