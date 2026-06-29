import type { ApiResponse } from "@evportal/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
const ACCESS_TOKEN_KEY = "evportal.accessToken";
const REFRESH_TOKEN_KEY = "evportal.refreshToken";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type SafeUser = {
  id: string;
  globalCustomerId: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  normalizedEmail: string | null;
  normalizedPhone: string | null;
  role: string;
  preferredLanguage: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResult = {
  user: SafeUser;
  tokens: AuthTokens;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload.data as T;
}

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function registerCustomer(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  return request<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: input.fullName || undefined,
      email: input.email || undefined,
      phone: input.phone || undefined,
      password: input.password,
      role: "CUSTOMER",
      preferredLanguage: "hy"
    })
  });
}

export async function login(input: { emailOrPhone: string; password: string }) {
  return request<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getMe() {
  const accessToken = getAccessToken();

  return request<{ user: SafeUser }>("/auth/me", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  });
}

export async function logout() {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    await request<{ loggedOut: boolean }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    });
  }

  clearTokens();
}
