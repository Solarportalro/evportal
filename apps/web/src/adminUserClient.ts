import type { ApiResponse } from "@evportal/shared";
import { getAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export type AdminUser = {
  id: string;
  email: string | null;
  phone: string | null;
  normalizedEmail: string | null;
  normalizedPhone: string | null;
  role: string;
  preferredLanguage: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  disabledAt: string | null;
  disabledReason: string | null;
  createdAt: string;
  updatedAt: string;
  globalCustomer: {
    id: string;
    normalizedPhone: string | null;
    normalizedEmail: string | null;
    fullName: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  companyMemberships: Array<{
    id: string;
    role: string;
    createdAt: string;
    company: {
      id: string;
      publicName: string;
      type: string;
      status: string;
    };
  }>;
};

export type AdminUserFilters = {
  role?: string;
  isActive?: string;
  search?: string;
};

async function adminUserRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export function listAdminUsers(filters: AdminUserFilters = {}) {
  const params = new URLSearchParams();

  if (filters.role) {
    params.set("role", filters.role);
  }

  if (filters.isActive) {
    params.set("isActive", filters.isActive);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  return adminUserRequest<{ users: AdminUser[] }>(`/admin/users${query ? `?${query}` : ""}`);
}

export function getAdminUser(userId: string) {
  return adminUserRequest<{ user: AdminUser }>(`/admin/users/${userId}`);
}

export function updateAdminUser(userId: string, input: {
  preferredLanguage?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}) {
  return adminUserRequest<{ user: AdminUser }>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function disableAdminUser(userId: string, reason?: string) {
  return adminUserRequest<{ user: AdminUser }>(`/admin/users/${userId}/disable`, {
    method: "PATCH",
    body: JSON.stringify({ reason: reason || undefined })
  });
}

export function enableAdminUser(userId: string) {
  return adminUserRequest<{ user: AdminUser }>(`/admin/users/${userId}/enable`, {
    method: "PATCH"
  });
}

export function changeAdminUserRole(userId: string, role: string, adminNote?: string) {
  return adminUserRequest<{ user: AdminUser }>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role, adminNote: adminNote || undefined })
  });
}
