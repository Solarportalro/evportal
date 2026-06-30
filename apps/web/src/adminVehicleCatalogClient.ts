import type { ApiResponse, VehicleMake, VehicleModel } from "@evportal/shared";
import { getAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export type AdminVehicleMake = VehicleMake & {
  isActive: boolean;
  _count?: {
    models: number;
  };
};

export type AdminVehicleModel = VehicleModel & {
  isActive: boolean;
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

export function listAdminMakes() {
  return adminRequest<{ makes: AdminVehicleMake[] }>("/admin/vehicle-catalog/makes");
}

export function createAdminMake(name: string) {
  return adminRequest<{ make: AdminVehicleMake }>("/admin/vehicle-catalog/makes", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function updateAdminMake(makeId: string, name: string) {
  return adminRequest<{ make: AdminVehicleMake }>(`/admin/vehicle-catalog/makes/${makeId}`, {
    method: "PATCH",
    body: JSON.stringify({ name })
  });
}

export function setAdminMakeActive(makeId: string, isActive: boolean) {
  return adminRequest<{ make: AdminVehicleMake }>(
    `/admin/vehicle-catalog/makes/${makeId}/${isActive ? "activate" : "deactivate"}`,
    { method: "PATCH" }
  );
}

export function listAdminModels(makeId: string) {
  return adminRequest<{ models: AdminVehicleModel[] }>(`/admin/vehicle-catalog/makes/${makeId}/models`);
}

export function createAdminModel(makeId: string, name: string) {
  return adminRequest<{ model: AdminVehicleModel }>(`/admin/vehicle-catalog/makes/${makeId}/models`, {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function updateAdminModel(modelId: string, name: string) {
  return adminRequest<{ model: AdminVehicleModel }>(`/admin/vehicle-catalog/models/${modelId}`, {
    method: "PATCH",
    body: JSON.stringify({ name })
  });
}

export function setAdminModelActive(modelId: string, isActive: boolean) {
  return adminRequest<{ model: AdminVehicleModel }>(
    `/admin/vehicle-catalog/models/${modelId}/${isActive ? "activate" : "deactivate"}`,
    { method: "PATCH" }
  );
}
