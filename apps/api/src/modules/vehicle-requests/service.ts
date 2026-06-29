import {
  HasSolar,
  PurchaseTimeline,
  SolarChargingInterest,
  StockImportPreference,
  UserRole,
  VehicleBodyType,
  VehicleFuelType,
  VehicleRequestMode
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

function assertCanAccessVehicleRequests(user: AuthenticatedUser) {
  if (user.role !== UserRole.CUSTOMER && !ADMIN_READ_ROLES.has(user.role)) {
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
