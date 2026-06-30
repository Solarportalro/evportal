const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000/api";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
  code?: string;
};

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(`${path} failed with ${response.status}: ${payload.message ?? payload.code ?? "unknown error"}`);
  }

  return payload.data as T;
}

async function login(emailOrPhone: string, password: string) {
  const data = await request<{ tokens: { accessToken: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ emailOrPhone, password })
  });

  return data.tokens.accessToken;
}

async function authenticatedRequest<T>(path: string, accessToken: string) {
  return request<T>(path, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

async function main() {
  await request<{ status: string }>("/health");
  await request<{ status: string; database: string }>("/ready");

  const adminToken = await login("admin@evportal.local", "Admin12345!");
  const customerToken = await login("customer@evportal.local", "Customer12345!");
  const companyToken = await login("company1@evportal.local", "Company12345!");

  await authenticatedRequest<{ overview: Record<string, unknown> }>("/admin/reports/overview", adminToken);
  await authenticatedRequest<{ vehicleRequests: unknown[] }>("/vehicle-requests", customerToken);
  await authenticatedRequest<{ vehicleRequests: unknown[] }>("/company/vehicle-requests", companyToken);

  console.log("Smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Smoke test failed");
  process.exitCode = 1;
});
