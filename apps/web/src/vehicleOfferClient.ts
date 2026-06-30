import type { ApiResponse, ContactReveal, VehicleMake, VehicleModel, VehicleOffer } from "@evportal/shared";
import { getAccessToken } from "./authClient";
import type { VehicleRequest } from "./vehicleRequestClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export type VehicleOfferWithRelations = VehicleOffer & {
  make: VehicleMake | null;
  model: VehicleModel | null;
  company?: {
    id: string;
    publicName: string;
    type: string;
    status: string;
  };
  request?: VehicleRequest;
};

export type ContactRevealWithRelations = ContactReveal & {
  company?: {
    id: string;
    publicName: string;
  };
  offer?: VehicleOfferWithRelations;
  request?: {
    id: string;
    status: string;
  };
};

export type VehicleOfferInput = {
  offerType: string;
  makeId?: string;
  modelId?: string;
  manualMake?: string;
  manualModel?: string;
  year?: number;
  trim?: string;
  fuelType: string;
  batteryCapacityKwh?: number;
  rangeKm?: number;
  mileageKm?: number;
  color?: string;
  availabilityStatus: string;
  condition?: string;
  sourceMarket?: string;
  batteryChemistry?: string;
  chargingPortType?: string;
  acChargingKw?: number;
  dcFastChargingKw?: number;
  driveType?: string;
  accidentHistoryDeclared?: string;
  vinAvailable?: boolean;
  photosAvailable?: boolean;
  documentsAvailable?: boolean;
  inspectionIncluded?: boolean;
  sourceCountry?: string;
  estimatedDeliveryDaysMin?: number;
  estimatedDeliveryDaysMax?: number;
  priceAmount: number;
  currency: string;
  priceIncludesCustoms?: boolean;
  priceIncludesRegistration?: boolean;
  priceIncludesDeliveryToArmenia?: boolean;
  priceIncludesDealerFee?: boolean;
  priceIsFinal?: boolean;
  advancePaymentRequired?: boolean;
  advancePaymentAmount?: number;
  advancePaymentRefundable?: boolean;
  warrantyMonths?: number;
  batteryWarrantyMonths?: number;
  warrantyProvider?: string;
  serviceSupportIncluded?: boolean;
  chargerIncluded?: boolean;
  financingAvailable?: boolean;
  tradeInAccepted?: boolean;
  offerValidUntil?: string;
  notes?: string;
};

async function offerRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export function listCompanyVehicleRequests() {
  return offerRequest<{ vehicleRequests: VehicleRequest[] }>("/company/vehicle-requests");
}

export function getCompanyVehicleRequest(requestId: string) {
  return offerRequest<{ vehicleRequest: VehicleRequest }>(`/company/vehicle-requests/${requestId}`);
}

export function listCompanyOffersForRequest(requestId: string) {
  return offerRequest<{ vehicleOffers: VehicleOfferWithRelations[] }>(`/company/vehicle-requests/${requestId}/offers`);
}

export function createCompanyOffer(requestId: string, input: VehicleOfferInput) {
  return offerRequest<{ vehicleOffer: VehicleOfferWithRelations }>(`/company/vehicle-requests/${requestId}/offers`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function listCompanyOffers() {
  return offerRequest<{ vehicleOffers: VehicleOfferWithRelations[] }>("/company/vehicle-offers");
}

export function updateCompanyOffer(offerId: string, input: Partial<VehicleOfferInput>) {
  return offerRequest<{ vehicleOffer: VehicleOfferWithRelations }>(`/company/vehicle-offers/${offerId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function withdrawCompanyOffer(offerId: string) {
  return offerRequest<{ vehicleOffer: VehicleOfferWithRelations }>(`/company/vehicle-offers/${offerId}/withdraw`, {
    method: "PATCH"
  });
}

export function getCompanyRequestContact(requestId: string) {
  return offerRequest<{ contactReveal: ContactReveal }>(`/company/vehicle-requests/${requestId}/contact`);
}

export function listCustomerOffersForRequest(requestId: string) {
  return offerRequest<{ vehicleOffers: VehicleOfferWithRelations[] }>(`/customer/vehicle-requests/${requestId}/offers`);
}

export function getCustomerOffer(offerId: string) {
  return offerRequest<{ vehicleOffer: VehicleOfferWithRelations }>(`/customer/vehicle-offers/${offerId}`);
}

export function selectCustomerOffer(offerId: string) {
  return offerRequest<{
    selectedOffer: VehicleOfferWithRelations;
    vehicleRequest: { id: string; status: string };
    contactReveal: ContactReveal;
  }>(`/customer/vehicle-offers/${offerId}/select`, {
    method: "POST",
    body: JSON.stringify({ confirmContactReveal: true })
  });
}

export function listAdminVehicleOffers() {
  return offerRequest<{ vehicleOffers: VehicleOfferWithRelations[] }>("/admin/vehicle-offers");
}

export function getAdminVehicleOffer(offerId: string) {
  return offerRequest<{ vehicleOffer: VehicleOfferWithRelations }>(`/admin/vehicle-offers/${offerId}`);
}

export function listAdminContactReveals() {
  return offerRequest<{ contactReveals: ContactRevealWithRelations[] }>("/admin/contact-reveals");
}

export function getAdminContactReveal(revealId: string) {
  return offerRequest<{ contactReveal: ContactRevealWithRelations }>(`/admin/contact-reveals/${revealId}`);
}
