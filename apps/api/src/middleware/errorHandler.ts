import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { errorResponse } from "../apiResponse.js";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json(errorResponse("Validation failed"));
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json(errorResponse(error.message));
    return;
  }

  response.status(500).json(errorResponse("Internal server error"));
};
