import { Prisma, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { AppError } from "../../middleware/errorHandler.js";
import { prisma } from "../../prisma.js";

export type AdminUserListFilters = {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
};

export type AdminUserUpdateInput = {
  preferredLanguage?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
};

const ADMIN_ROLES = new Set<UserRole>([UserRole.PLATFORM_ADMIN, UserRole.SUPPORT]);
const ALL_ROLES = new Set<UserRole>([
  UserRole.CUSTOMER,
  UserRole.COMPANY_USER,
  UserRole.COMPANY_ADMIN,
  UserRole.SUPPORT,
  UserRole.PLATFORM_ADMIN
]);

const safeUserSelect = {
  id: true,
  email: true,
  phone: true,
  normalizedEmail: true,
  normalizedPhone: true,
  role: true,
  preferredLanguage: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isActive: true,
  disabledAt: true,
  disabledReason: true,
  createdAt: true,
  updatedAt: true,
  globalCustomer: {
    select: {
      id: true,
      normalizedPhone: true,
      normalizedEmail: true,
      fullName: true,
      createdAt: true,
      updatedAt: true
    }
  },
  companyMemberships: {
    select: {
      id: true,
      role: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          publicName: true,
          type: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  }
} satisfies Prisma.UserSelect;

function assertAdminRole(user: AuthenticatedUser) {
  if (!ADMIN_ROLES.has(user.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function assertPlatformAdmin(user: AuthenticatedUser) {
  if (user.role !== UserRole.PLATFORM_ADMIN) {
    throw new AppError("Only platform admins can change user roles", 403, "PLATFORM_ADMIN_ONLY");
  }
}

function cleanText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function buildUserWhere(filters: AdminUserListFilters): Prisma.UserWhereInput {
  const search = cleanText(filters.search);

  return {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { normalizedEmail: { contains: search, mode: "insensitive" } },
            { normalizedPhone: { contains: search, mode: "insensitive" } },
            { globalCustomer: { fullName: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };
}

export async function listAdminUsers(user: AuthenticatedUser, filters: AdminUserListFilters) {
  assertAdminRole(user);

  return prisma.user.findMany({
    where: buildUserWhere(filters),
    select: safeUserSelect,
    orderBy: { createdAt: "desc" }
  });
}

export async function getAdminUser(user: AuthenticatedUser, userId: string) {
  assertAdminRole(user);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect
  });

  if (!targetUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return targetUser;
}

export async function updateAdminUser(user: AuthenticatedUser, userId: string, input: AdminUserUpdateInput) {
  assertAdminRole(user);

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      preferredLanguage: true,
      isEmailVerified: true,
      isPhoneVerified: true
    }
  });

  if (!previous) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const data = {
    ...(input.preferredLanguage !== undefined ? { preferredLanguage: input.preferredLanguage.trim() || "hy" } : {}),
    ...(input.isEmailVerified !== undefined ? { isEmailVerified: input.isEmailVerified } : {}),
    ...(input.isPhoneVerified !== undefined ? { isPhoneVerified: input.isPhoneVerified } : {})
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: safeUserSelect
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: user.id,
      action: "USER_ADMIN_UPDATED",
      entityType: "User",
      entityId: userId,
      metadata: {
        previous: {
          preferredLanguage: previous.preferredLanguage,
          isEmailVerified: previous.isEmailVerified,
          isPhoneVerified: previous.isPhoneVerified
        },
        next: {
          preferredLanguage: updatedUser.preferredLanguage,
          isEmailVerified: updatedUser.isEmailVerified,
          isPhoneVerified: updatedUser.isPhoneVerified
        }
      }
    }
  });

  return updatedUser;
}

export async function disableAdminUser(user: AuthenticatedUser, userId: string, input: { reason?: string | null }) {
  assertAdminRole(user);

  if (user.id === userId) {
    throw new AppError("You cannot disable your own user", 400, "CANNOT_DISABLE_SELF");
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, disabledAt: true, disabledReason: true }
  });

  if (!previous) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const disabledReason = cleanText(input.reason);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      disabledAt: new Date(),
      disabledReason
    },
    select: safeUserSelect
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: user.id,
      action: "USER_DISABLED",
      entityType: "User",
      entityId: userId,
      metadata: {
        previous,
        next: {
          isActive: updatedUser.isActive,
          disabledAt: updatedUser.disabledAt,
          disabledReason: updatedUser.disabledReason
        },
        ...(disabledReason ? { reason: disabledReason } : {})
      }
    }
  });

  return updatedUser;
}

export async function enableAdminUser(user: AuthenticatedUser, userId: string) {
  assertAdminRole(user);

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, disabledAt: true, disabledReason: true }
  });

  if (!previous) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true,
      disabledAt: null,
      disabledReason: null
    },
    select: safeUserSelect
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: user.id,
      action: "USER_ENABLED",
      entityType: "User",
      entityId: userId,
      metadata: {
        previous,
        next: {
          isActive: updatedUser.isActive,
          disabledAt: updatedUser.disabledAt,
          disabledReason: updatedUser.disabledReason
        }
      }
    }
  });

  return updatedUser;
}

export async function changeAdminUserRole(
  user: AuthenticatedUser,
  userId: string,
  input: { role: UserRole; adminNote?: string | null }
) {
  assertPlatformAdmin(user);

  if (!ALL_ROLES.has(input.role)) {
    throw new AppError("Role is not allowed", 400, "ROLE_NOT_ALLOWED");
  }

  if (user.id === userId) {
    throw new AppError("You cannot change your own role", 400, "CANNOT_CHANGE_OWN_ROLE");
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });

  if (!previous) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (previous.role === UserRole.PLATFORM_ADMIN && input.role !== UserRole.PLATFORM_ADMIN) {
    const platformAdminCount = await prisma.user.count({
      where: { role: UserRole.PLATFORM_ADMIN, isActive: true }
    });

    if (platformAdminCount <= 1) {
      throw new AppError("Cannot remove the last active platform admin", 400, "LAST_PLATFORM_ADMIN");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: input.role },
    select: safeUserSelect
  });

  const adminNote = cleanText(input.adminNote);

  await prisma.activityLog.create({
    data: {
      actorUserId: user.id,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: userId,
      metadata: {
        previous: { role: previous.role },
        next: { role: updatedUser.role },
        ...(adminNote ? { adminNote } : {})
      }
    }
  });

  return updatedUser;
}
