import type { ApiResponse } from "@evportal/shared";

export function successResponse<T>(data: T, message: string | null = null): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function errorResponse(message: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message
  };
}
