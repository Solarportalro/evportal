import type { ApiResponse } from "@evportal/shared";

export function successResponse<T>(data: T, message: string | null = null): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function errorResponse(
  message: string,
  code = "INTERNAL_ERROR",
  details?: Record<string, unknown>
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message,
    code,
    details
  };
}
