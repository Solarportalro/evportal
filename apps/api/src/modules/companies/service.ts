import { CompanyStatus, Prisma, UserRole, type CompanyType } from "@prisma/client";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { AppError } from "../../middleware/errorHandler.js";
import { prisma } from "../../prisma.js";

export type CompanyProfileInput = {
  publicName?: string;
  legalName?: string | null;
  type?: CompanyType;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  taxId?: string | null;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  contactPersonEmail?: string | null;
};

type CompanyStatusTransition = {
  nextStatus: CompanyStatus;
  allowedFrom: CompanyStatus[];
  action: string;
};

const COMPANY_ROLES = new Set<UserRole>([UserRole.COMPANY_USER, UserRole.COMPANY_ADMIN]);
const ADMIN_ROLES = new Set<UserRole>([UserRole.PLATFORM_ADMIN, UserRole.SUPPORT]);

const statusTransitions = {
  approve: {
    nextStatus: CompanyStatus.ACTIVE,
    allowedFrom: [CompanyStatus.PENDING, CompanyStatus.REJECTED, CompanyStatus.SUSPENDED],
    action: "COMPANY_APPROVED"
  },
  reject: {
    nextStatus: CompanyStatus.REJECTED,
    allowedFrom: [CompanyStatus.PENDING],
    action: "COMPANY_REJECTED"
  },
  suspend: {
    nextStatus: CompanyStatus.SUSPENDED,
    allowedFrom: [CompanyStatus.ACTIVE],
    action: "COMPANY_SUSPENDED"
  },
  reactivate: {
    nextStatus: CompanyStatus.ACTIVE,
    allowedFrom: [CompanyStatus.SUSPENDED, CompanyStatus.REJECTED],
    action: "COMPANY_REACTIVATED"
  }
} satisfies Record<string, CompanyStatusTransition>;

const companyInclude = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  }
} satisfies Prisma.CompanyInclude;

function cleanText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

export function normalizeCompanyProfileInput(input: CompanyProfileInput) {
  return {
    ...(input.publicName !== undefined ? { publicName: input.publicName.trim() } : {}),
    ...(input.legalName !== undefined ? { legalName: cleanText(input.legalName) } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.phone !== undefined ? { phone: cleanText(input.phone) } : {}),
    ...(input.email !== undefined ? { email: cleanText(input.email) } : {}),
    ...(input.website !== undefined ? { website: cleanText(input.website) } : {}),
    ...(input.description !== undefined ? { description: cleanText(input.description) } : {}),
    ...(input.address !== undefined ? { address: cleanText(input.address) } : {}),
    ...(input.city !== undefined ? { city: cleanText(input.city) } : {}),
    ...(input.taxId !== undefined ? { taxId: cleanText(input.taxId) } : {}),
    ...(input.contactPersonName !== undefined ? { contactPersonName: cleanText(input.contactPersonName) } : {}),
    ...(input.contactPersonPhone !== undefined ? { contactPersonPhone: cleanText(input.contactPersonPhone) } : {}),
    ...(input.contactPersonEmail !== undefined ? { contactPersonEmail: cleanText(input.contactPersonEmail) } : {})
  };
}

function assertCompanyRole(user: AuthenticatedUser) {
  if (!COMPANY_ROLES.has(user.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function assertAdminRole(user: AuthenticatedUser) {
  if (!ADMIN_ROLES.has(user.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

export async function getCompanyMembership(user: AuthenticatedUser) {
  assertCompanyRole(user);

  const membership = await prisma.companyMember.findFirst({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) {
    throw new AppError("Company membership required", 403, "COMPANY_MEMBERSHIP_REQUIRED");
  }

  return membership;
}

export function assertCompanyIsActive(company: { status: CompanyStatus }) {
  if (company.status === CompanyStatus.PENDING) {
    throw new AppError("Company is waiting for approval", 403, "COMPANY_NOT_APPROVED");
  }

  if (company.status === CompanyStatus.SUSPENDED) {
    throw new AppError("Company is suspended", 403, "COMPANY_SUSPENDED");
  }

  if (company.status === CompanyStatus.REJECTED) {
    throw new AppError("Company was rejected", 403, "COMPANY_REJECTED");
  }
}

export async function getOwnCompanyProfile(user: AuthenticatedUser) {
  const membership = await getCompanyMembership(user);

  return {
    company: membership.company,
    memberRole: membership.role
  };
}

export async function updateOwnCompanyProfile(user: AuthenticatedUser, input: CompanyProfileInput) {
  const membership = await getCompanyMembership(user);

  if (membership.role !== UserRole.COMPANY_ADMIN) {
    throw new AppError("Only company admins can update company profile", 403, "COMPANY_ADMIN_ONLY");
  }

  const data = normalizeCompanyProfileInput(input);

  if ("publicName" in data && !data.publicName) {
    throw new AppError("Public name is required", 400, "COMPANY_PUBLIC_NAME_REQUIRED");
  }

  const company = await prisma.company.update({
    where: { id: membership.companyId },
    data,
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: user.id,
      action: "COMPANY_PROFILE_UPDATED",
      entityType: "Company",
      entityId: company.id,
      metadata: { changedFields: Object.keys(data) }
    }
  });

  return {
    company,
    memberRole: membership.role
  };
}

export async function listAdminCompanies(user: AuthenticatedUser) {
  assertAdminRole(user);

  return prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { members: true, vehicleOffers: true }
      }
    }
  });
}

export async function getAdminCompany(user: AuthenticatedUser, companyId: string) {
  assertAdminRole(user);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: companyInclude
  });

  if (!company) {
    throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  return company;
}

export async function updateAdminCompany(user: AuthenticatedUser, companyId: string, input: CompanyProfileInput) {
  assertAdminRole(user);

  const data = normalizeCompanyProfileInput(input);

  if ("publicName" in data && !data.publicName) {
    throw new AppError("Public name is required", 400, "COMPANY_PUBLIC_NAME_REQUIRED");
  }

  const previous = await prisma.company.findUnique({ where: { id: companyId } });

  if (!previous) {
    throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  const company = await prisma.company.update({
    where: { id: companyId },
    data,
    include: companyInclude
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: user.id,
      action: "COMPANY_ADMIN_UPDATED",
      entityType: "Company",
      entityId: company.id,
      metadata: { changedFields: Object.keys(data) }
    }
  });

  return company;
}

export async function transitionAdminCompany(
  user: AuthenticatedUser,
  companyId: string,
  transition: CompanyStatusTransition,
  input: { adminNote?: string | null } = {}
) {
  assertAdminRole(user);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, status: true }
  });

  if (!company) {
    throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  if (!transition.allowedFrom.includes(company.status)) {
    throw new AppError("Invalid company status transition", 400, "INVALID_COMPANY_STATUS_TRANSITION", {
      previousStatus: company.status,
      nextStatus: transition.nextStatus
    });
  }

  const adminNote = cleanText(input.adminNote);

  const updatedCompany = await prisma.$transaction(async (transactionClient) => {
    const nextCompany = await transactionClient.company.update({
      where: { id: company.id },
      data: { status: transition.nextStatus },
      include: companyInclude
    });

    await transactionClient.activityLog.create({
      data: {
        actorUserId: user.id,
        action: transition.action,
        entityType: "Company",
        entityId: company.id,
        metadata: {
          previousStatus: company.status,
          nextStatus: transition.nextStatus,
          ...(adminNote ? { adminNote } : {})
        }
      }
    });

    return nextCompany;
  });

  return updatedCompany;
}

export const companyStatusTransitions = statusTransitions;
