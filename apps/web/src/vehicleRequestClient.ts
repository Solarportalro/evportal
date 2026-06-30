import type { VehicleMake, VehicleModel } from "@evportal/shared";
import { getAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
};

export type VehicleRequest = {
  id: string;
  customerId: string;
  requestMode: string;
  status: string;
  fuelType: string;
  makeId: string | null;
  make: VehicleMake | null;
  modelId: string | null;
  model: VehicleModel | null;
  manualMake: string | null;
  manualModel: string | null;
  displayMake: string | null;
  displayModel: string | null;
  preferredYearFrom: number | null;
  preferredYearTo: number | null;
  bodyType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  desiredRangeKm: number | null;
  stockImportPreference: string;
  purchaseTimeline: string;
  hasSolar: string;
  solarChargingInterest: string;
  conditionPreference: string;
  maxMileageKm: number | null;
  financingInterest: string;
  tradeInInterest: boolean;
  chargerNeeded: string;
  customerRegion: string | null;
  customerCity: string | null;
  usageType: string | null;
  chargingAccess: string | null;
  notes: string | null;
  hasContactAccess?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateVehicleRequestInput = {
  requestMode: string;
  fuelType: string;
  makeId?: string;
  modelId?: string;
  manualMake?: string;
  manualModel?: string;
  preferredYearFrom?: number;
  preferredYearTo?: number;
  bodyType?: string;
  budgetMin?: number;
  budgetMax?: number;
  desiredRangeKm?: number;
  stockImportPreference: string;
  purchaseTimeline: string;
  hasSolar: string;
  solarChargingInterest?: string;
  conditionPreference?: string;
  maxMileageKm?: number;
  financingInterest?: string;
  tradeInInterest?: boolean;
  chargerNeeded?: string;
  customerRegion?: string;
  customerCity?: string;
  usageType?: string;
  chargingAccess?: string;
  notes?: string;
};

export type PublicVehicleRequestInput = CreateVehicleRequestInput & {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredLanguage?: string;
};

async function vehicleRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export function listVehicleRequests() {
  return vehicleRequest<{ vehicleRequests: VehicleRequest[] }>("/vehicle-requests");
}

export function getVehicleRequest(id: string) {
  return vehicleRequest<{ vehicleRequest: VehicleRequest }>(`/vehicle-requests/${id}`);
}

export function createVehicleRequest(input: CreateVehicleRequestInput) {
  return vehicleRequest<{ vehicleRequest: VehicleRequest }>("/vehicle-requests", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function createPublicVehicleRequest(input: PublicVehicleRequestInput) {
  return vehicleRequest<{
    vehicleRequest: VehicleRequest;
    userCreated: boolean;
    accountNeedsPassword: boolean;
    devSetPasswordToken?: string;
    devSetPasswordUrl?: string;
  }>("/public/vehicle-requests", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
