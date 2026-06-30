import type { ApiResponse, CompanyProfile } from "@evportal/shared";
import { getAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export type AdminCompany = CompanyProfile & {
  members?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      email: string | null;
      phone: string | null;
      role: string;
    };
  }>;
  _count?: {
    members: number;
    vehicleOffers: number;
  };
};

async function adminCompanyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export function listAdminCompanies() {
  return adminCompanyRequest<{ companies: AdminCompany[] }>("/admin/companies");
}

export function getAdminCompany(companyId: string) {
  return adminCompanyRequest<{ company: AdminCompany }>(`/admin/companies/${companyId}`);
}

export function updateAdminCompany(companyId: string, input: Partial<AdminCompany>) {
  return adminCompanyRequest<{ company: AdminCompany }>(`/admin/companies/${companyId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function transitionAdminCompany(companyId: string, action: string, adminNote?: string) {
  return adminCompanyRequest<{ company: AdminCompany }>(`/admin/companies/${companyId}/${action}`, {
    method: "PATCH",
    body: JSON.stringify({ adminNote: adminNote || undefined })
  });
}
