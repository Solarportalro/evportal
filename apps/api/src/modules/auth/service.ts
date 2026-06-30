import { CompanyStatus, Prisma, UserRole, type CompanyType } from "@prisma/client";
import { config } from "../../config.js";
import { AppError } from "../../middleware/errorHandler.js";
import { findOrCreateGlobalCustomer } from "../global-customers/service.js";
import { prisma } from "../../prisma.js";
import { normalizeArmenianPhone, normalizeEmail, normalizeIdentityInput } from "../../utils/identity.js";
import { addDuration, generateRandomToken, hashPassword, hashToken, verifyPassword } from "../../utils/security.js";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { normalizeCompanyProfileInput, type CompanyProfileInput } from "../companies/service.js";
import { toSafeUser } from "./types.js";

const PUBLIC_REGISTRATION_ROLES = new Set<UserRole>([
  UserRole.CUSTOMER,
  UserRole.COMPANY_USER,
  UserRole.COMPANY_ADMIN
]);

export async function issueAuthTokens(user: { id: string; role: UserRole }) {
  const accessToken = createAccessToken({ userId: user.id, role: user.role });
  const refreshToken = createRefreshToken({ userId: user.id });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: addDuration(new Date(), config.JWT_REFRESH_EXPIRES_IN)
    }
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  password: string;
  role?: UserRole;
  preferredLanguage?: string;
}) {
  const role = input.role ?? UserRole.CUSTOMER;

  if (!PUBLIC_REGISTRATION_ROLES.has(role)) {
    throw new AppError("This role cannot be self-registered", 403, "ROLE_NOT_ALLOWED");
  }

  const normalized = normalizeIdentityInput(input);

  if (!normalized.normalizedEmail && !normalized.normalizedPhone) {
    throw new AppError("Email or valid Armenian phone number is required", 400, "IDENTIFIER_REQUIRED");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(normalized.normalizedEmail ? [{ normalizedEmail: normalized.normalizedEmail }] : []),
        ...(normalized.normalizedPhone ? [{ normalizedPhone: normalized.normalizedPhone }] : [])
      ]
    }
  });

  if (existingUser) {
    throw new AppError("User already exists", 409, "USER_EXISTS");
  }

  const globalCustomer = await findOrCreateGlobalCustomer(input);
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      globalCustomerId: globalCustomer?.id,
      email: normalized.normalizedEmail,
      phone: normalized.normalizedPhone,
      normalizedEmail: normalized.normalizedEmail,
      normalizedPhone: normalized.normalizedPhone,
      passwordHash,
      role,
      preferredLanguage: input.preferredLanguage?.trim() || "hy"
    },
    include: { globalCustomer: true }
  });

  return {
    user: toSafeUser(user),
    tokens: await issueAuthTokens(user)
  };
}

export async function registerCompany(input: {
  fullName?: string | null;
  email: string;
  phone?: string | null;
  password: string;
  preferredLanguage?: string;
  company: CompanyProfileInput & {
    publicName: string;
    type: CompanyType;
  };
}) {
  const normalized = normalizeIdentityInput(input);

  if (!normalized.normalizedEmail) {
    throw new AppError("Email is required", 400, "EMAIL_REQUIRED");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { normalizedEmail: normalized.normalizedEmail },
        ...(normalized.normalizedPhone ? [{ normalizedPhone: normalized.normalizedPhone }] : [])
      ]
    }
  });

  if (existingUser) {
    throw new AppError("User already exists", 409, "USER_EXISTS");
  }

  const companyData = normalizeCompanyProfileInput(input.company);

  if (!companyData.publicName) {
    throw new AppError("Company public name is required", 400, "COMPANY_PUBLIC_NAME_REQUIRED");
  }

  if (!companyData.type) {
    throw new AppError("Company type is required", 400, "COMPANY_TYPE_REQUIRED");
  }

  const publicName = companyData.publicName;
  const companyType = companyData.type;

  const globalCustomer = await findOrCreateGlobalCustomer(input);
  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (transactionClient) => {
    const user = await transactionClient.user.create({
      data: {
        globalCustomerId: globalCustomer?.id,
        email: normalized.normalizedEmail,
        phone: normalized.normalizedPhone,
        normalizedEmail: normalized.normalizedEmail,
        normalizedPhone: normalized.normalizedPhone,
        passwordHash,
        role: UserRole.COMPANY_ADMIN,
        preferredLanguage: input.preferredLanguage?.trim() || "hy"
      },
      include: { globalCustomer: true }
    });

    const company = await transactionClient.company.create({
      data: {
        publicName,
        legalName: companyData.legalName,
        type: companyType,
        status: CompanyStatus.PENDING,
        phone: companyData.phone,
        email: companyData.email,
        website: companyData.website,
        description: companyData.description,
        address: companyData.address,
        city: companyData.city,
        taxId: companyData.taxId,
        contactPersonName: companyData.contactPersonName,
        contactPersonPhone: companyData.contactPersonPhone,
        contactPersonEmail: companyData.contactPersonEmail
      }
    });

    await transactionClient.companyMember.create({
      data: {
        companyId: company.id,
        userId: user.id,
        role: UserRole.COMPANY_ADMIN
      }
    });

    await transactionClient.activityLog.create({
      data: {
        actorUserId: user.id,
        action: "COMPANY_CREATED_FROM_REGISTRATION",
        entityType: "Company",
        entityId: company.id,
        metadata: {
          status: company.status,
          publicName: company.publicName,
          type: company.type
        }
      }
    });

    return { user, company };
  });

  return {
    user: toSafeUser(result.user),
    company: result.company,
    tokens: await issueAuthTokens(result.user)
  };
}

export async function loginUser(input: { emailOrPhone: string; password: string }) {
  const normalizedEmail = normalizeEmail(input.emailOrPhone);
  const normalizedPhone = normalizeArmenianPhone(input.emailOrPhone);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(normalizedEmail ? [{ normalizedEmail }] : []),
        ...(normalizedPhone ? [{ normalizedPhone }] : [])
      ]
    },
    include: { globalCustomer: true }
  });

  if (!user?.passwordHash) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  return {
    user: toSafeUser(user),
    tokens: await issueAuthTokens(user)
  };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: { sub: string };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true }
  });

  if (
    !storedToken ||
    storedToken.userId !== payload.sub ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  return {
    accessToken: createAccessToken({
      userId: storedToken.user.id,
      role: storedToken.user.role
    })
  };
}

export async function logoutWithRefreshToken(refreshToken?: string | null) {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshToken),
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { globalCustomer: true }
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return toSafeUser(user);
}

export async function requestSetPassword(emailOrPhone: string) {
  const normalizedEmail = normalizeEmail(emailOrPhone);
  const normalizedPhone = normalizeArmenianPhone(emailOrPhone);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(normalizedEmail ? [{ normalizedEmail }] : []),
        ...(normalizedPhone ? [{ normalizedPhone }] : [])
      ]
    }
  });

  if (!user) {
    return null;
  }

  const token = generateRandomToken();

  await prisma.setPasswordToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: addDuration(new Date(), config.SET_PASSWORD_TOKEN_EXPIRES_IN)
    }
  });

  return token;
}

export async function setPassword(input: { token: string; password: string }) {
  const tokenHash = hashToken(input.token);
  const token = await prisma.setPasswordToken.findUnique({
    where: { tokenHash }
  });

  if (!token || token.usedAt || token.expiresAt <= new Date()) {
    throw new AppError("Invalid or expired set-password token", 400, "INVALID_SET_PASSWORD_TOKEN");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash: await hashPassword(input.password) }
    }),
    prisma.setPasswordToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    })
  ]);
}

export function isPrismaUniqueError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
