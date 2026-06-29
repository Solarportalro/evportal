export type IdentityInput = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type NormalizedIdentityInput = {
  fullName: string | null;
  normalizedEmail: string | null;
  normalizedPhone: string | null;
};

export function normalizeEmail(email?: string | null): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function normalizeArmenianPhone(phone?: string | null): string | null {
  if (!phone) {
    return null;
  }

  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d]/g, "");

  if (trimmed.startsWith("+") && /^\+374\d{8}$/.test(`+${digits}`)) {
    return `+${digits}`;
  }

  if (/^0\d{8}$/.test(digits)) {
    return `+374${digits.slice(1)}`;
  }

  if (/^374\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  return null;
}

export function normalizeIdentityInput(input: IdentityInput): NormalizedIdentityInput {
  const fullName = input.fullName?.trim() || null;

  return {
    fullName,
    normalizedEmail: normalizeEmail(input.email),
    normalizedPhone: normalizeArmenianPhone(input.phone)
  };
}
