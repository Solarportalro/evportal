import type { ApiResponse, CompanyProfile } from "@evportal/shared";
import { getAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export type CompanyProfileResult = {
  company: CompanyProfile;
  memberRole: string;
};

export type CompanyProfileInput = Partial<
  Pick<
    CompanyProfile,
    | "publicName"
    | "legalName"
    | "type"
    | "phone"
    | "email"
    | "website"
    | "description"
    | "address"
    | "city"
    | "taxId"
    | "contactPersonName"
    | "contactPersonPhone"
    | "contactPersonEmail"
  >
>;

async function companyProfileRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export function getCompanyProfile() {
  return companyProfileRequest<CompanyProfileResult>("/company/profile");
}

export function updateCompanyProfile(input: CompanyProfileInput) {
  return companyProfileRequest<CompanyProfileResult>("/company/profile", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}
