import type { User, UserRole } from "@prisma/client";

export type SafeUser = {
  id: string;
  globalCustomerId: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  normalizedEmail: string | null;
  normalizedPhone: string | null;
  role: UserRole;
  preferredLanguage: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toSafeUser(user: User & { globalCustomer?: { fullName: string | null } | null }): SafeUser {
  return {
    id: user.id,
    globalCustomerId: user.globalCustomerId,
    fullName: user.globalCustomer?.fullName ?? null,
    email: user.email,
    phone: user.phone,
    normalizedEmail: user.normalizedEmail,
    normalizedPhone: user.normalizedPhone,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}
