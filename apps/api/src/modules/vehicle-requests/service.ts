import {
  HasSolar,
  Prisma,
  PurchaseTimeline,
  SolarChargingInterest,
  StockImportPreference,
  UserRole,
  VehicleBodyType,
  VehicleFuelType,
  VehicleRequestMode,
  VehicleRequestStatus
} from "@prisma/client";
import { AppError } from "../../middleware/errorHandler.js";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { prisma } from "../../prisma.js";

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
  notes?: string | null;
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
    notes: cleanText(input.notes),
    solarChargingInterest: input.solarChargingInterest ?? SolarChargingInterest.NOT_ASKED
  };
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
  await validateCatalogSelection(data);

  const request = await prisma.vehicleRequest.create({
    data: {
      customerId: user.id,
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
