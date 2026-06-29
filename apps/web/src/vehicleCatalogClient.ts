import type { ApiResponse, VehicleMake, VehicleModel } from "@evportal/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

async function catalogRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload.data as T;
}

export function listVehicleMakes() {
  return catalogRequest<{ makes: VehicleMake[] }>("/vehicle-catalog/makes");
}

export function listVehicleModels(makeId: string) {
  return catalogRequest<{ models: VehicleModel[] }>(`/vehicle-catalog/makes/${makeId}/models`);
}
