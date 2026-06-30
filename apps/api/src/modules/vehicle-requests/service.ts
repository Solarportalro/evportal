import {
  HasSolar,
  ChargerNeed,
  FinancingInterest,
  Prisma,
  PurchaseTimeline,
  SolarChargingInterest,
  StockImportPreference,
  UserRole,
  VehicleBodyType,
  VehicleConditionPreference,
  VehicleFuelType,
  VehicleRequestMode,
  VehicleRequestStatus
} from "@prisma/client";
import { config } from "../../config.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { prisma } from "../../prisma.js";
import { findOrCreateGlobalCustomer } from "../global-customers/service.js";
import { addDuration, generateRandomToken, hashToken } from "../../utils/security.js";
import { normalizeIdentityInput } from "../../utils/identity.js";

export type CreateVehicleRequestInput = {
  requestMode: VehicleRequestMode;
  fuelType: VehicleFuelType;
  makeId?: string | null;
  modelId?: string | null;
  manualMake?: string | null;
  manualModel?: string | null;
  preferredYearFrom?: number | null;
  preferredYearTo?: number | null;
  bodyType?: VehicleBodyType | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  desiredRangeKm?: number | null;
  stockImportPreference: StockImportPreference;
  purchaseTimeline: PurchaseTimeline;
  hasSolar: HasSolar;
  solarChargingInterest?: SolarChargingInterest;
  conditionPreference?: VehicleConditionPreference;
  maxMileageKm?: number | null;
  financingInterest?: FinancingInterest;
  tradeInInterest?: boolean;
  chargerNeeded?: ChargerNeed;
  customerRegion?: string | null;
  customerCity?: string | null;
  usageType?: string | null;
  chargingAccess?: string | null;
  notes?: string | null;
};

export type PublicVehicleRequestInput = CreateVehicleRequestInput & {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredLanguage?: string | null;
};

const ADMIN_READ_ROLES = new Set<UserRole>([UserRole.PLATFORM_ADMIN, UserRole.SUPPORT]);
const ADMIN_ACTION_ROLES = new Set<UserRole>([UserRole.PLATFORM_ADMIN, UserRole.SUPPORT]);

type VehicleRequestTransition = {
  nextStatus: VehicleRequestStatus;
  allowedFrom: VehicleRequestStatus[];
  action: string;
};

const transitions = {
  approve: {
    nextStatus: VehicleRequestStatus.ACTIVE,
    allowedFrom: [VehicleRequestStatus.SUBMITTED, VehicleRequestStatus.UNDER_REVIEW, VehicleRequestStatus.REJECTED],
    action: "VEHICLE_REQUEST_APPROVED"
  },
  reject: {
    nextStatus: VehicleRequestStatus.REJECTED,
    allowedFrom: [VehicleRequestStatus.SUBMITTED, VehicleRequestStatus.UNDER_REVIEW],
    action: "VEHICLE_REQUEST_REJECTED"
  },
  cancel: {
    nextStatus: VehicleRequestStatus.CANCELLED,
    allowedFrom: [
      VehicleRequestStatus.SUBMITTED,
      VehicleRequestStatus.UNDER_REVIEW,
      VehicleRequestStatus.ACTIVE,
      VehicleRequestStatus.OFFERS_RECEIVED,
      VehicleRequestStatus.CUSTOMER_DECIDING
    ],
    action: "VEHICLE_REQUEST_CANCELLED"
  },
  expire: {
    nextStatus: VehicleRequestStatus.EXPIRED,
    allowedFrom: [VehicleRequestStatus.ACTIVE, VehicleRequestStatus.OFFERS_RECEIVED, VehicleRequestStatus.CUSTOMER_DECIDING],
    action: "VEHICLE_REQUEST_EXPIRED"
  },
  closeSuccessfully: {
    nextStatus: VehicleRequestStatus.CLOSED_SUCCESSFULLY,
    allowedFrom: [VehicleRequestStatus.COMPANY_SELECTED, VehicleRequestStatus.CUSTOMER_DECIDING, VehicleRequestStatus.OFFERS_RECEIVED],
    action: "VEHICLE_REQUEST_CLOSED_SUCCESSFULLY"
  },
  closeWithoutPurchase: {
    nextStatus: VehicleRequestStatus.CLOSED_WITHOUT_PURCHASE,
    allowedFrom: [
      VehicleRequestStatus.ACTIVE,
      VehicleRequestStatus.OFFERS_RECEIVED,
      VehicleRequestStatus.CUSTOMER_DECIDING,
      VehicleRequestStatus.COMPANY_SELECTED
    ],
    action: "VEHICLE_REQUEST_CLOSED_WITHOUT_PURCHASE"
  }
} satisfies Record<string, VehicleRequestTransition>;

function assertCanAccessVehicleRequests(user: AuthenticatedUser) {
  if (user.role !== UserRole.CUSTOMER && !ADMIN_READ_ROLES.has(user.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function assertCanModerateVehicleRequests(user: AuthenticatedUser) {
  if (!ADMIN_ACTION_ROLES.has(user.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function cleanText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function normalizeCreateInput(input: CreateVehicleRequestInput): CreateVehicleRequestInput {
  const makeId = cleanText(input.makeId);
  const modelId = cleanText(input.modelId);
  const hasCatalogSelection = Boolean(makeId || modelId);

  return {
    ...input,
    makeId: hasCatalogSelection ? makeId : null,
    modelId: hasCatalogSelection ? modelId : null,
    manualMake: hasCatalogSelection ? null : cleanText(input.manualMake),
    manualModel: hasCatalogSelection ? null : cleanText(input.manualModel),
    conditionPreference: input.conditionPreference ?? VehicleConditionPreference.NOT_SURE,
    financingInterest: input.financingInterest ?? FinancingInterest.NOT_SURE,
    tradeInInterest: input.tradeInInterest ?? false,
    chargerNeeded: input.chargerNeeded ?? ChargerNeed.NOT_SURE,
    customerRegion: cleanText(input.customerRegion),
    customerCity: cleanText(input.customerCity),
    usageType: cleanText(input.usageType),
    chargingAccess: cleanText(input.chargingAccess),
    notes: cleanText(input.notes),
    solarChargingInterest: input.solarChargingInterest ?? SolarChargingInterest.NOT_ASKED
  };
}

export function validateVehicleRequestInput(input: CreateVehicleRequestInput) {
  if (input.maxMileageKm !== undefined && input.maxMileageKm !== null && input.maxMileageKm < 0) {
    throw new AppError("maxMileageKm must be non-negative", 400, "INVALID_MAX_MILEAGE");
  }

  if (input.budgetMin && input.budgetMax && input.budgetMin > input.budgetMax) {
    throw new AppError("budgetMin must not exceed budgetMax", 400, "INVALID_BUDGET_RANGE");
  }

  if (input.preferredYearFrom && input.preferredYearTo && input.preferredYearFrom > input.preferredYearTo) {
    throw new AppError("preferredYearFrom must not exceed preferredYearTo", 400, "INVALID_YEAR_RANGE");
  }

  if (input.requestMode === VehicleRequestMode.EXACT_MODEL) {
    const hasCatalogVehicle = Boolean(input.makeId?.trim() && input.modelId?.trim());
    const hasManualVehicle = Boolean(input.manualMake?.trim() && input.manualModel?.trim());

    if (!hasCatalogVehicle && !hasManualVehicle) {
      throw new AppError("Exact-model requests require either catalog make/model or manual make/model", 400, "EXACT_MODEL_VEHICLE_REQUIRED");
    }

    if ((input.makeId?.trim() && !input.modelId?.trim()) || (!input.makeId?.trim() && input.modelId?.trim())) {
      throw new AppError("Both makeId and modelId are required when using catalog selection", 400, "CATALOG_SELECTION_INCOMPLETE");
    }

    if ((input.manualMake?.trim() && !input.manualModel?.trim()) || (!input.manualMake?.trim() && input.manualModel?.trim())) {
      throw new AppError("Both manualMake and manualModel are required when using manual selection", 400, "MANUAL_SELECTION_INCOMPLETE");
    }
  }

  if (input.requestMode === VehicleRequestMode.RECOMMENDATION) {
    if (!input.budgetMin && !input.budgetMax) {
      throw new AppError("budgetMin or budgetMax is required for recommendation requests", 400, "RECOMMENDATION_BUDGET_REQUIRED");
    }

    if (!input.bodyType) {
      throw new AppError("bodyType is required for recommendation requests", 400, "RECOMMENDATION_BODY_TYPE_REQUIRED");
    }
  }
}

async function validateCatalogSelection(input: CreateVehicleRequestInput) {
  if (!input.makeId && !input.modelId) {
    return;
  }

  if (!input.makeId || !input.modelId) {
    throw new AppError("Both makeId and modelId are required when using catalog selection", 400, "CATALOG_SELECTION_INCOMPLETE");
  }

  const [make, model] = await Promise.all([
    prisma.vehicleMake.findFirst({
      where: {
        id: input.makeId,
        isActive: true
      }
    }),
    prisma.vehicleModel.findFirst({
      where: {
        id: input.modelId,
        isActive: true
      }
    })
  ]);

  if (!make) {
    throw new AppError("Vehicle make not found", 400, "VEHICLE_MAKE_NOT_FOUND");
  }

  if (!model || model.makeId !== make.id) {
    throw new AppError("Vehicle model not found for selected make", 400, "VEHICLE_MODEL_NOT_FOUND");
  }
}

function withDisplayVehicle<T extends { make?: { name: string } | null; model?: { name: string } | null; manualMake?: string | null; manualModel?: string | null }>(
  request: T
) {
  return {
    ...request,
    displayMake: request.make?.name ?? request.manualMake ?? null,
    displayModel: request.model?.name ?? request.manualModel ?? null
  };
}

export async function createVehicleRequest(user: AuthenticatedUser, input: CreateVehicleRequestInput) {
  if (user.role !== UserRole.CUSTOMER) {
    throw new AppError("Only customers can create vehicle requests", 403, "CUSTOMER_ONLY");
  }

  const data = normalizeCreateInput(input);
  validateVehicleRequestInput(data);
  await validateCatalogSelection(data);

  return createVehicleRequestForCustomer(user.id, data);
}

async function createVehicleRequestForCustomer(customerId: string, data: CreateVehicleRequestInput) {
  const request = await prisma.vehicleRequest.create({
    data: {
      customerId,
      requestMode: data.requestMode,
      fuelType: data.fuelType,
      makeId: data.makeId,
      modelId: data.modelId,
      manualMake: data.manualMake,
      manualModel: data.manualModel,
      preferredYearFrom: data.preferredYearFrom,
      preferredYearTo: data.preferredYearTo,
      bodyType: data.bodyType,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      desiredRangeKm: data.desiredRangeKm,
      stockImportPreference: data.stockImportPreference,
      purchaseTimeline: data.purchaseTimeline,
      hasSolar: data.hasSolar,
      solarChargingInterest: data.solarChargingInterest,
      conditionPreference: data.conditionPreference,
      maxMileageKm: data.maxMileageKm,
      financingInterest: data.financingInterest,
      tradeInInterest: data.tradeInInterest,
      chargerNeeded: data.chargerNeeded,
      customerRegion: data.customerRegion,
      customerCity: data.customerCity,
      usageType: data.usageType,
      chargingAccess: data.chargingAccess,
      notes: data.notes
    },
    include: {
      make: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      model: {
        select: {
          id: true,
          makeId: true,
          name: true,
          slug: true
        }
      },
      customer: {
        select: {
          id: true,
          email: true,
          phone: true,
          role: true
        }
      }
    }
  });

  return withDisplayVehicle(request);
}

export async function createPublicVehicleRequest(input: PublicVehicleRequestInput) {
  const normalized = normalizeIdentityInput(input);

  if (!normalized.normalizedEmail && !normalized.normalizedPhone) {
    throw new AppError("Valid email or Armenian phone number is required", 400, "IDENTIFIER_REQUIRED");
  }

  const data = normalizeCreateInput(input);
  validateVehicleRequestInput(data);
  await validateCatalogSelection(data);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(normalized.normalizedPhone ? [{ normalizedPhone: normalized.normalizedPhone }] : []),
        ...(normalized.normalizedEmail ? [{ normalizedEmail: normalized.normalizedEmail }] : [])
      ]
    }
  });

  if (existingUser && existingUser.role !== UserRole.CUSTOMER) {
    throw new AppError("Existing account cannot be used for customer request", 409, "USER_ROLE_NOT_CUSTOMER");
  }

  if (existingUser && !existingUser.isActive) {
    throw new AppError("User is disabled", 403, "USER_DISABLED");
  }

  const globalCustomer = await findOrCreateGlobalCustomer(input);
  let userCreated = false;

  const result = await prisma.$transaction(async (transactionClient) => {
    const user =
      existingUser ??
      (await transactionClient.user.create({
        data: {
          globalCustomerId: globalCustomer?.id,
          email: normalized.normalizedEmail,
          phone: normalized.normalizedPhone,
          normalizedEmail: normalized.normalizedEmail,
          normalizedPhone: normalized.normalizedPhone,
          passwordHash: null,
          role: UserRole.CUSTOMER,
          preferredLanguage: input.preferredLanguage?.trim() || "hy"
        }
      }));

    userCreated = !existingUser;

    const updatedUser =
      existingUser && ((!existingUser.globalCustomerId && globalCustomer?.id) || (!existingUser.email && normalized.normalizedEmail) || (!existingUser.phone && normalized.normalizedPhone))
        ? await transactionClient.user.update({
            where: { id: existingUser.id },
            data: {
              globalCustomerId: existingUser.globalCustomerId ?? globalCustomer?.id,
              email: existingUser.email ?? normalized.normalizedEmail,
              phone: existingUser.phone ?? normalized.normalizedPhone,
              normalizedEmail: existingUser.normalizedEmail ?? normalized.normalizedEmail,
              normalizedPhone: existingUser.normalizedPhone ?? normalized.normalizedPhone
            }
          })
        : user;

    const vehicleRequest = await transactionClient.vehicleRequest.create({
      data: {
        customerId: updatedUser.id,
        requestMode: data.requestMode,
        status: VehicleRequestStatus.SUBMITTED,
        fuelType: data.fuelType,
        makeId: data.makeId,
        modelId: data.modelId,
        manualMake: data.manualMake,
        manualModel: data.manualModel,
        preferredYearFrom: data.preferredYearFrom,
        preferredYearTo: data.preferredYearTo,
        bodyType: data.bodyType,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        desiredRangeKm: data.desiredRangeKm,
        stockImportPreference: data.stockImportPreference,
        purchaseTimeline: data.purchaseTimeline,
        hasSolar: data.hasSolar,
        solarChargingInterest: data.solarChargingInterest,
        conditionPreference: data.conditionPreference,
        maxMileageKm: data.maxMileageKm,
        financingInterest: data.financingInterest,
        tradeInInterest: data.tradeInInterest,
        chargerNeeded: data.chargerNeeded,
        customerRegion: data.customerRegion,
        customerCity: data.customerCity,
        usageType: data.usageType,
        chargingAccess: data.chargingAccess,
        notes: data.notes
      },
      include: {
        make: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        model: {
          select: {
            id: true,
            makeId: true,
            name: true,
            slug: true
          }
        },
        customer: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true
          }
        }
      }
    });

    let rawSetPasswordToken: string | null = null;

    if (!updatedUser.passwordHash) {
      rawSetPasswordToken = generateRandomToken();
      await transactionClient.setPasswordToken.create({
        data: {
          userId: updatedUser.id,
          tokenHash: hashToken(rawSetPasswordToken),
          expiresAt: addDuration(new Date(), config.SET_PASSWORD_TOKEN_EXPIRES_IN)
        }
      });
    }

    const accountNeedsPassword = !updatedUser.passwordHash;

    await transactionClient.activityLog.create({
      data: {
        actorUserId: updatedUser.id,
        action: "PUBLIC_VEHICLE_REQUEST_CREATED",
        entityType: "VehicleRequest",
        entityId: vehicleRequest.id,
        metadata: {
          userCreated,
          accountNeedsPassword,
          requestId: vehicleRequest.id,
          source: "public_form"
        }
      }
    });

    if (userCreated) {
      await transactionClient.activityLog.create({
        data: {
          actorUserId: updatedUser.id,
          action: "USER_CREATED_FROM_PUBLIC_REQUEST",
          entityType: "User",
          entityId: updatedUser.id,
          metadata: {
            requestId: vehicleRequest.id,
            source: "public_form"
          }
        }
      });
    }

    return {
      vehicleRequest,
      userCreated,
      accountNeedsPassword,
      rawSetPasswordToken
    };
  });

  return {
    vehicleRequest: withDisplayVehicle(result.vehicleRequest),
    userCreated: result.userCreated,
    accountNeedsPassword: result.accountNeedsPassword,
    ...(config.NODE_ENV !== "production" && result.rawSetPasswordToken
      ? {
          devSetPasswordToken: result.rawSetPasswordToken,
          devSetPasswordUrl: `${config.FRONTEND_URL}/login?setPasswordToken=${encodeURIComponent(result.rawSetPasswordToken)}`
        }
      : {})
  };
}

export async function listVehicleRequests(user: AuthenticatedUser) {
  assertCanAccessVehicleRequests(user);

  const requests = await prisma.vehicleRequest.findMany({
    where: user.role === UserRole.CUSTOMER ? { customerId: user.id } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      make: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      model: {
        select: {
          id: true,
          makeId: true,
          name: true,
          slug: true
        }
      }
    }
  });

  return requests.map(withDisplayVehicle);
}

export async function getVehicleRequest(user: AuthenticatedUser, id: string) {
  assertCanAccessVehicleRequests(user);

  const request = await prisma.vehicleRequest.findFirst({
    where: {
      id,
      ...(user.role === UserRole.CUSTOMER ? { customerId: user.id } : {})
    },
    include: {
      make: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      model: {
        select: {
          id: true,
          makeId: true,
          name: true,
          slug: true
        }
      },
      customer: {
        select: {
          id: true,
          email: true,
          phone: true,
          role: true
        }
      }
    }
  });

  if (!request) {
    throw new AppError("Vehicle request not found", 404, "VEHICLE_REQUEST_NOT_FOUND");
  }

  return withDisplayVehicle(request);
}

const adminVehicleRequestInclude = {
  make: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  model: {
    select: {
      id: true,
      makeId: true,
      name: true,
      slug: true
    }
  },
  customer: {
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      globalCustomer: {
        select: {
          fullName: true
        }
      }
    }
  },
  _count: {
    select: {
      offers: true
    }
  }
} satisfies Prisma.VehicleRequestInclude;

export async function listAdminVehicleRequests(user: AuthenticatedUser) {
  assertCanModerateVehicleRequests(user);

  const requests = await prisma.vehicleRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: adminVehicleRequestInclude
  });

  return requests.map(withDisplayVehicle);
}

export async function getAdminVehicleRequest(user: AuthenticatedUser, requestId: string) {
  assertCanModerateVehicleRequests(user);

  const request = await prisma.vehicleRequest.findUnique({
    where: { id: requestId },
    include: adminVehicleRequestInclude
  });

  if (!request) {
    throw new AppError("Vehicle request not found", 404, "VEHICLE_REQUEST_NOT_FOUND");
  }

  return withDisplayVehicle(request);
}

export async function transitionAdminVehicleRequest(
  user: AuthenticatedUser,
  requestId: string,
  transition: VehicleRequestTransition,
  input: { adminNote?: string | null } = {}
) {
  assertCanModerateVehicleRequests(user);

  const request = await prisma.vehicleRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true }
  });

  if (!request) {
    throw new AppError("Vehicle request not found", 404, "VEHICLE_REQUEST_NOT_FOUND");
  }

  if (!transition.allowedFrom.includes(request.status)) {
    throw new AppError("Invalid status transition", 400, "INVALID_STATUS_TRANSITION", {
      previousStatus: request.status,
      nextStatus: transition.nextStatus
    });
  }

  const adminNote = cleanText(input.adminNote);

  const updatedRequest = await prisma.$transaction(async (transactionClient) => {
    const nextRequest = await transactionClient.vehicleRequest.update({
      where: { id: request.id },
      data: { status: transition.nextStatus },
      include: adminVehicleRequestInclude
    });

    await transactionClient.activityLog.create({
      data: {
        actorUserId: user.id,
        action: transition.action,
        entityType: "VehicleRequest",
        entityId: request.id,
        metadata: {
          previousStatus: request.status,
          nextStatus: transition.nextStatus,
          ...(adminNote ? { adminNote } : {})
        }
      }
    });

    return nextRequest;
  });

  return withDisplayVehicle(updatedRequest);
}

export const vehicleRequestTransitions = transitions;
