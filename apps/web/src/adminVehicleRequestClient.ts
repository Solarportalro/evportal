import type { ApiResponse } from "@evportal/shared";
import { getAccessToken } from "./authClient";
import type { VehicleRequest } from "./vehicleRequestClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export type AdminVehicleRequest = VehicleRequest & {
  customer?: {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    globalCustomer?: {
      fullName: string | null;
    } | null;
  };
  _count?: {
    offers: number;
  };
};

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload.data as T;
}

export function listAdminVehicleRequests() {
  return adminRequest<{ vehicleRequests: AdminVehicleRequest[] }>("/admin/vehicle-requests");
}

export function getAdminVehicleRequest(requestId: string) {
  return adminRequest<{ vehicleRequest: AdminVehicleRequest }>(`/admin/vehicle-requests/${requestId}`);
}

export function transitionAdminVehicleRequest(requestId: string, action: string, adminNote?: string) {
  return adminRequest<{ vehicleRequest: AdminVehicleRequest }>(`/admin/vehicle-requests/${requestId}/${action}`, {
    method: "PATCH",
    body: JSON.stringify({ adminNote: adminNote || undefined })
  });
}
