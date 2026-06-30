import {
  CompanyStatus,
  Prisma,
  UserRole,
  VehicleOfferStatus,
  VehicleRequestStatus,
  type OfferCurrency,
  type VehicleAvailabilityStatus,
  type VehicleFuelType,
  type VehicleOfferType
} from "@prisma/client";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { AppError } from "../../middleware/errorHandler.js";
import { prisma } from "../../prisma.js";

export type VehicleOfferInput = {
  offerType: VehicleOfferType;
  makeId?: string | null;
  modelId?: string | null;
  manualMake?: string | null;
  manualModel?: string | null;
  year?: number | null;
  trim?: string | null;
  fuelType: VehicleFuelType;
  batteryCapacityKwh?: number | null;
  rangeKm?: number | null;
  mileageKm?: number | null;
  color?: string | null;
  availabilityStatus: VehicleAvailabilityStatus;
  sourceCountry?: string | null;
  estimatedDeliveryDaysMin?: number | null;
  estimatedDeliveryDaysMax?: number | null;
  priceAmount: number;
  currency: OfferCurrency;
  priceIncludesCustoms?: boolean;
  priceIncludesRegistration?: boolean;
  priceIncludesDeliveryToArmenia?: boolean;
  priceIncludesDealerFee?: boolean;
  priceIsFinal?: boolean;
  advancePaymentRequired?: boolean;
  advancePaymentAmount?: number | null;
  advancePaymentRefundable?: boolean | null;
  warrantyMonths?: number | null;
  batteryWarrantyMonths?: number | null;
  warrantyProvider?: string | null;
  serviceSupportIncluded?: boolean;
  chargerIncluded?: boolean;
  financingAvailable?: boolean;
  tradeInAccepted?: boolean;
  offerValidUntil?: string | Date | null;
  notes?: string | null;
};

export type VehicleOfferUpdateInput = Partial<VehicleOfferInput>;

const COMPANY_ROLES = new Set<UserRole>([UserRole.COMPANY_USER, UserRole.COMPANY_ADMIN]);
const ADMIN_ROLES = new Set<UserRole>([UserRole.PLATFORM_ADMIN, UserRole.SUPPORT]);
const COMPANY_VISIBLE_REQUEST_STATUSES: VehicleRequestStatus[] = [
  VehicleRequestStatus.ACTIVE,
  VehicleRequestStatus.OFFERS_RECEIVED,
  VehicleRequestStatus.CUSTOMER_DECIDING
];
const COMPANY_OFFERABLE_REQUEST_STATUSES: VehicleRequestStatus[] = [
  VehicleRequestStatus.ACTIVE,
  VehicleRequestStatus.OFFERS_RECEIVED,
  VehicleRequestStatus.CUSTOMER_DECIDING
];
const SELECTABLE_OFFER_STATUSES: VehicleOfferStatus[] = [VehicleOfferStatus.SUBMITTED, VehicleOfferStatus.UPDATED];
const ACTIVE_OFFER_STATUSES: VehicleOfferStatus[] = [
  VehicleOfferStatus.SUBMITTED,
  VehicleOfferStatus.UPDATED,
  VehicleOfferStatus.SELECTED
];
const CUSTOMER_VISIBLE_OFFER_STATUSES: VehicleOfferStatus[] = [
  VehicleOfferStatus.SUBMITTED,
  VehicleOfferStatus.UPDATED,
  VehicleOfferStatus.SELECTED,
  VehicleOfferStatus.REJECTED_BY_CUSTOMER
];
const SELECTABLE_REQUEST_STATUSES: VehicleRequestStatus[] = [
  VehicleRequestStatus.OFFERS_RECEIVED,
  VehicleRequestStatus.CUSTOMER_DECIDING,
  VehicleRequestStatus.ACTIVE,
  VehicleRequestStatus.SUBMITTED
];
export const CONTACT_REVEAL_CONSENT_TEXT =
  "By continuing, your contact information will be shared only with this company so they can contact you about this offer. Other companies will not receive your contact information.";

function cleanText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function assertCompanyRole(user: AuthenticatedUser) {
  if (!COMPANY_ROLES.has(user.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function assertCustomerRole(user: AuthenticatedUser) {
  if (user.role !== UserRole.CUSTOMER) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function assertAdminRole(user: AuthenticatedUser) {
  if (!ADMIN_ROLES.has(user.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

async function getUserCompany(user: AuthenticatedUser) {
  assertCompanyRole(user);

  const membership = await prisma.companyMember.findFirst({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) {
    throw new AppError("Company membership required", 403, "COMPANY_MEMBERSHIP_REQUIRED");
  }

  if (membership.company.status === CompanyStatus.PENDING) {
    throw new AppError("Company is waiting for approval", 403, "COMPANY_NOT_APPROVED");
  }

  if (membership.company.status === CompanyStatus.SUSPENDED) {
    throw new AppError("Company is suspended", 403, "COMPANY_SUSPENDED");
  }

  if (membership.company.status === CompanyStatus.REJECTED) {
    throw new AppError("Company was rejected", 403, "COMPANY_REJECTED");
  }

  return membership.company;
}

function withDisplayVehicle<
  T extends {
    make?: { name: string } | null;
    model?: { name: string } | null;
    manualMake?: string | null;
    manualModel?: string | null;
  }
>(offer: T) {
  return {
    ...offer,
    displayMake: offer.make?.name ?? offer.manualMake ?? null,
    displayModel: offer.model?.name ?? offer.manualModel ?? null
  };
}

const offerInclude = {
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
  company: {
    select: {
      id: true,
      publicName: true,
      type: true,
      status: true
    }
  },
  request: {
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
  }
} satisfies Prisma.VehicleOfferInclude;

function normalizeCreateInput(input: VehicleOfferInput): VehicleOfferInput {
  const makeId = cleanText(input.makeId);
  const modelId = cleanText(input.modelId);
  const hasCatalogSelection = Boolean(makeId || modelId);

  return {
    ...input,
    makeId: hasCatalogSelection ? makeId : null,
    modelId: hasCatalogSelection ? modelId : null,
    manualMake: hasCatalogSelection ? null : cleanText(input.manualMake),
    manualModel: hasCatalogSelection ? null : cleanText(input.manualModel),
    trim: cleanText(input.trim),
    color: cleanText(input.color),
    sourceCountry: cleanText(input.sourceCountry),
    warrantyProvider: cleanText(input.warrantyProvider),
    notes: cleanText(input.notes),
    offerValidUntil: input.offerValidUntil ? new Date(input.offerValidUntil) : null
  };
}

function normalizeUpdateInput(input: VehicleOfferUpdateInput): VehicleOfferUpdateInput {
  const makeId = cleanText(input.makeId);
  const modelId = cleanText(input.modelId);
  const hasCatalogSelection = Boolean(makeId || modelId);
  const hasManualSelection = Boolean(cleanText(input.manualMake) || cleanText(input.manualModel));

  return {
    ...input,
    ...(input.makeId !== undefined || input.modelId !== undefined || hasManualSelection
      ? {
          makeId: hasCatalogSelection ? makeId : null,
          modelId: hasCatalogSelection ? modelId : null,
          manualMake: hasCatalogSelection ? null : cleanText(input.manualMake),
          manualModel: hasCatalogSelection ? null : cleanText(input.manualModel)
        }
      : {}),
    trim: input.trim === undefined ? undefined : cleanText(input.trim),
    color: input.color === undefined ? undefined : cleanText(input.color),
    sourceCountry: input.sourceCountry === undefined ? undefined : cleanText(input.sourceCountry),
    warrantyProvider: input.warrantyProvider === undefined ? undefined : cleanText(input.warrantyProvider),
    notes: input.notes === undefined ? undefined : cleanText(input.notes),
    offerValidUntil:
      input.offerValidUntil === undefined ? undefined : input.offerValidUntil ? new Date(input.offerValidUntil) : null
  };
}

async function validateCatalogSelection(input: { makeId?: string | null; modelId?: string | null; manualMake?: string | null; manualModel?: string | null }) {
  const hasCatalogSelection = Boolean(input.makeId || input.modelId);
  const hasManualSelection = Boolean(input.manualMake || input.manualModel);

  if (hasCatalogSelection && hasManualSelection) {
    throw new AppError("Use either catalog make/model or manual make/model", 400, "VEHICLE_SELECTION_CONFLICT");
  }

  if (!hasCatalogSelection && !hasManualSelection) {
    throw new AppError("Offer requires either catalog make/model or manual make/model", 400, "VEHICLE_SELECTION_REQUIRED");
  }

  if (hasCatalogSelection) {
    if (!input.makeId || !input.modelId) {
      throw new AppError("Both makeId and modelId are required", 400, "CATALOG_SELECTION_INCOMPLETE");
    }

    const [make, model] = await Promise.all([
      prisma.vehicleMake.findFirst({ where: { id: input.makeId, isActive: true } }),
      prisma.vehicleModel.findFirst({ where: { id: input.modelId, isActive: true } })
    ]);

    if (!make) {
      throw new AppError("Vehicle make not found", 400, "VEHICLE_MAKE_NOT_FOUND");
    }

    if (!model || model.makeId !== make.id) {
      throw new AppError("Vehicle model not found for selected make", 400, "VEHICLE_MODEL_NOT_FOUND");
    }
  }

  if (hasManualSelection && (!input.manualMake || !input.manualModel)) {
    throw new AppError("Both manualMake and manualModel are required", 400, "MANUAL_SELECTION_INCOMPLETE");
  }
}

async function getVisibleCompanyRequest(requestId: string, companyId?: string) {
  const vehicleRequest = await prisma.vehicleRequest.findFirst({
    where: {
      id: requestId,
      OR: [
        { status: { in: COMPANY_VISIBLE_REQUEST_STATUSES } },
        ...(companyId
          ? [
              {
                status: VehicleRequestStatus.COMPANY_SELECTED,
                contactReveal: { companyId }
              }
            ]
          : [])
      ]
    },
    include: {
      make: { select: { id: true, name: true, slug: true } },
      model: { select: { id: true, makeId: true, name: true, slug: true } },
      contactReveal: { select: { companyId: true } }
    }
  });

  if (!vehicleRequest) {
    throw new AppError("Vehicle request not found", 404, "VEHICLE_REQUEST_NOT_FOUND");
  }

  const safeRequest = { ...vehicleRequest };
  delete (safeRequest as { contactReveal?: unknown }).contactReveal;

  return {
    ...safeRequest,
    hasContactAccess: Boolean(companyId && vehicleRequest.contactReveal?.companyId === companyId),
    displayMake: vehicleRequest.make?.name ?? vehicleRequest.manualMake ?? null,
    displayModel: vehicleRequest.model?.name ?? vehicleRequest.manualModel ?? null
  };
}

async function getOfferableCompanyRequest(requestId: string) {
  const vehicleRequest = await prisma.vehicleRequest.findFirst({
    where: {
      id: requestId,
      status: { in: COMPANY_OFFERABLE_REQUEST_STATUSES }
    },
    select: { id: true }
  });

  if (!vehicleRequest) {
    throw new AppError("Vehicle request not found", 404, "VEHICLE_REQUEST_NOT_FOUND");
  }
}

async function logActivity(actorUserId: string, action: string, entityId: string, metadata?: Prisma.InputJsonObject) {
  await prisma.activityLog.create({
    data: {
      actorUserId,
      action,
      entityType: "VehicleOffer",
      entityId,
      metadata
    }
  });
}

export async function listCompanyVehicleRequests(user: AuthenticatedUser) {
  const company = await getUserCompany(user);

  const requests = await prisma.vehicleRequest.findMany({
    where: {
      OR: [
        { status: { in: COMPANY_VISIBLE_REQUEST_STATUSES } },
        {
          status: VehicleRequestStatus.COMPANY_SELECTED,
          contactReveal: { companyId: company.id }
        }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: {
      make: { select: { id: true, name: true, slug: true } },
      model: { select: { id: true, makeId: true, name: true, slug: true } },
      contactReveal: { select: { companyId: true } }
    }
  });

  return requests.map((request) => {
    const safeRequest = { ...request };
    delete (safeRequest as { contactReveal?: unknown }).contactReveal;

    return {
      ...safeRequest,
      hasContactAccess: request.contactReveal?.companyId === company.id,
      displayMake: request.make?.name ?? request.manualMake ?? null,
      displayModel: request.model?.name ?? request.manualModel ?? null
    };
  });
}

export async function getCompanyVehicleRequest(user: AuthenticatedUser, requestId: string) {
  const company = await getUserCompany(user);
  return getVisibleCompanyRequest(requestId, company.id);
}

export async function listCompanyOffersForRequest(user: AuthenticatedUser, requestId: string) {
  const company = await getUserCompany(user);
  await getVisibleCompanyRequest(requestId, company.id);

  const offers = await prisma.vehicleOffer.findMany({
    where: {
      requestId,
      companyId: company.id
    },
    orderBy: { createdAt: "desc" },
    include: offerInclude
  });

  return offers.map(withDisplayVehicle);
}

export async function createCompanyOffer(user: AuthenticatedUser, requestId: string, input: VehicleOfferInput) {
  const company = await getUserCompany(user);
  await getOfferableCompanyRequest(requestId);
  const data = normalizeCreateInput(input);
  await validateCatalogSelection(data);

  const activeOfferCount = await prisma.vehicleOffer.count({
    where: {
      requestId,
      companyId: company.id,
      status: { in: ACTIVE_OFFER_STATUSES }
    }
  });

  if (activeOfferCount >= 3) {
    throw new AppError("Maximum active offers reached for this request", 400, "ACTIVE_OFFER_LIMIT_REACHED");
  }

  const offer = await prisma.$transaction(async (transaction) => {
    const createdOffer = await transaction.vehicleOffer.create({
      data: {
        requestId,
        companyId: company.id,
        submittedByUserId: user.id,
        offerType: data.offerType,
        makeId: data.makeId,
        modelId: data.modelId,
        manualMake: data.manualMake,
        manualModel: data.manualModel,
        year: data.year,
        trim: data.trim,
        fuelType: data.fuelType,
        batteryCapacityKwh: data.batteryCapacityKwh,
        rangeKm: data.rangeKm,
        mileageKm: data.mileageKm,
        color: data.color,
        availabilityStatus: data.availabilityStatus,
        sourceCountry: data.sourceCountry,
        estimatedDeliveryDaysMin: data.estimatedDeliveryDaysMin,
        estimatedDeliveryDaysMax: data.estimatedDeliveryDaysMax,
        priceAmount: data.priceAmount,
        currency: data.currency,
        priceIncludesCustoms: data.priceIncludesCustoms ?? false,
        priceIncludesRegistration: data.priceIncludesRegistration ?? false,
        priceIncludesDeliveryToArmenia: data.priceIncludesDeliveryToArmenia ?? false,
        priceIncludesDealerFee: data.priceIncludesDealerFee ?? false,
        priceIsFinal: data.priceIsFinal ?? false,
        advancePaymentRequired: data.advancePaymentRequired ?? false,
        advancePaymentAmount: data.advancePaymentAmount,
        advancePaymentRefundable: data.advancePaymentRefundable,
        warrantyMonths: data.warrantyMonths,
        batteryWarrantyMonths: data.batteryWarrantyMonths,
        warrantyProvider: data.warrantyProvider,
        serviceSupportIncluded: data.serviceSupportIncluded ?? false,
        chargerIncluded: data.chargerIncluded ?? false,
        financingAvailable: data.financingAvailable ?? false,
        tradeInAccepted: data.tradeInAccepted ?? false,
        offerValidUntil: data.offerValidUntil as Date | null,
        notes: data.notes
      },
      include: offerInclude
    });

    await transaction.vehicleRequest.updateMany({
      where: {
        id: requestId,
        status: {
          in: [VehicleRequestStatus.ACTIVE, VehicleRequestStatus.SUBMITTED, VehicleRequestStatus.UNDER_REVIEW]
        }
      },
      data: { status: VehicleRequestStatus.OFFERS_RECEIVED }
    });

    await transaction.activityLog.create({
      data: {
        actorUserId: user.id,
        action: "VEHICLE_OFFER_CREATED",
        entityType: "VehicleOffer",
        entityId: createdOffer.id,
        metadata: {
          requestId,
          companyId: company.id,
          priceAmount: createdOffer.priceAmount,
          currency: createdOffer.currency
        }
      }
    });

    return createdOffer;
  });

  return withDisplayVehicle(offer);
}

export async function updateCompanyOffer(user: AuthenticatedUser, offerId: string, input: VehicleOfferUpdateInput) {
  const company = await getUserCompany(user);
  const existingOffer = await prisma.vehicleOffer.findFirst({
    where: {
      id: offerId,
      companyId: company.id
    }
  });

  if (!existingOffer) {
    throw new AppError("Vehicle offer not found", 404, "VEHICLE_OFFER_NOT_FOUND");
  }

  if (existingOffer.status === VehicleOfferStatus.WITHDRAWN) {
    throw new AppError("Withdrawn offers cannot be updated", 400, "OFFER_WITHDRAWN");
  }

  const patch = normalizeUpdateInput(input);
  const nextVehicleSelection = {
    makeId: patch.makeId !== undefined ? patch.makeId : existingOffer.makeId,
    modelId: patch.modelId !== undefined ? patch.modelId : existingOffer.modelId,
    manualMake: patch.manualMake !== undefined ? patch.manualMake : existingOffer.manualMake,
    manualModel: patch.manualModel !== undefined ? patch.manualModel : existingOffer.manualModel
  };
  await validateCatalogSelection(nextVehicleSelection);

  const updateData: Prisma.VehicleOfferUpdateInput = {
    ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
    status: existingOffer.status === VehicleOfferStatus.SUBMITTED ? VehicleOfferStatus.SUBMITTED : VehicleOfferStatus.UPDATED
  };

  const offer = await prisma.vehicleOffer.update({
    where: { id: existingOffer.id },
    data: updateData,
    include: offerInclude
  });

  await logActivity(user.id, "VEHICLE_OFFER_UPDATED", offer.id, {
    previous: {
      priceAmount: existingOffer.priceAmount,
      currency: existingOffer.currency,
      status: existingOffer.status
    },
    next: {
      priceAmount: offer.priceAmount,
      currency: offer.currency,
      status: offer.status
    }
  });

  return withDisplayVehicle(offer);
}

export async function withdrawCompanyOffer(user: AuthenticatedUser, offerId: string) {
  const company = await getUserCompany(user);
  const existingOffer = await prisma.vehicleOffer.findFirst({
    where: {
      id: offerId,
      companyId: company.id
    }
  });

  if (!existingOffer) {
    throw new AppError("Vehicle offer not found", 404, "VEHICLE_OFFER_NOT_FOUND");
  }

  const offer = await prisma.vehicleOffer.update({
    where: { id: existingOffer.id },
    data: { status: VehicleOfferStatus.WITHDRAWN },
    include: offerInclude
  });

  await logActivity(user.id, "VEHICLE_OFFER_WITHDRAWN", offer.id, {
    previous: { status: existingOffer.status },
    next: { status: offer.status }
  });

  return withDisplayVehicle(offer);
}

export async function listCompanyOffers(user: AuthenticatedUser) {
  const company = await getUserCompany(user);
  const offers = await prisma.vehicleOffer.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: offerInclude
  });

  return offers.map(withDisplayVehicle);
}

export async function listCustomerOffersForRequest(user: AuthenticatedUser, requestId: string) {
  assertCustomerRole(user);

  const request = await prisma.vehicleRequest.findFirst({
    where: {
      id: requestId,
      customerId: user.id
    }
  });

  if (!request) {
    throw new AppError("Vehicle request not found", 404, "VEHICLE_REQUEST_NOT_FOUND");
  }

  const offers = await prisma.vehicleOffer.findMany({
    where: {
      requestId,
      status: { in: CUSTOMER_VISIBLE_OFFER_STATUSES }
    },
    orderBy: { priceAmount: "asc" },
    include: offerInclude
  });

  return offers.map(withDisplayVehicle);
}

export async function getCustomerOffer(user: AuthenticatedUser, offerId: string) {
  assertCustomerRole(user);

  const offer = await prisma.vehicleOffer.findFirst({
    where: {
      id: offerId,
      status: { in: CUSTOMER_VISIBLE_OFFER_STATUSES },
      request: {
        customerId: user.id
      }
    },
    include: offerInclude
  });

  if (!offer) {
    throw new AppError("Vehicle offer not found", 404, "VEHICLE_OFFER_NOT_FOUND");
  }

  return withDisplayVehicle(offer);
}

export async function selectCustomerOffer(
  user: AuthenticatedUser,
  offerId: string,
  input: { confirmContactReveal?: boolean }
) {
  assertCustomerRole(user);

  if (input.confirmContactReveal !== true) {
    throw new AppError("Contact reveal confirmation is required", 400, "CONTACT_REVEAL_CONFIRMATION_REQUIRED");
  }

  const offer = await prisma.vehicleOffer.findFirst({
    where: {
      id: offerId,
      request: { customerId: user.id }
    },
    include: {
      request: {
        include: {
          contactReveal: true,
          customer: {
            include: {
              globalCustomer: true
            }
          }
        }
      }
    }
  });

  if (!offer) {
    throw new AppError("Vehicle offer not found", 404, "VEHICLE_OFFER_NOT_FOUND");
  }

  if (!SELECTABLE_OFFER_STATUSES.includes(offer.status)) {
    throw new AppError("This offer cannot be selected", 400, "OFFER_NOT_SELECTABLE");
  }

  if (offer.request.contactReveal) {
    throw new AppError("A company has already been selected for this request", 409, "CONTACT_ALREADY_REVEALED");
  }

  if (!SELECTABLE_REQUEST_STATUSES.includes(offer.request.status)) {
    throw new AppError("This request is not selectable", 400, "REQUEST_NOT_SELECTABLE");
  }

  const result = await prisma.$transaction(async (transaction) => {
    const selectedOffer = await transaction.vehicleOffer.update({
      where: { id: offer.id },
      data: { status: VehicleOfferStatus.SELECTED },
      include: offerInclude
    });

    await transaction.vehicleOffer.updateMany({
      where: {
        requestId: offer.requestId,
        id: { not: offer.id },
        status: { in: SELECTABLE_OFFER_STATUSES }
      },
      data: { status: VehicleOfferStatus.REJECTED_BY_CUSTOMER }
    });

    const updatedRequest = await transaction.vehicleRequest.update({
      where: { id: offer.requestId },
      data: { status: VehicleRequestStatus.COMPANY_SELECTED },
      select: { id: true, status: true }
    });

    const reveal = await transaction.contactReveal.create({
      data: {
        requestId: offer.requestId,
        offerId: offer.id,
        companyId: offer.companyId,
        customerId: user.id,
        revealedToUserId: offer.submittedByUserId,
        consentText: CONTACT_REVEAL_CONSENT_TEXT,
        customerName: offer.request.customer.globalCustomer?.fullName ?? null,
        customerEmail: offer.request.customer.email,
        customerPhone: offer.request.customer.phone
      }
    });

    await transaction.activityLog.createMany({
      data: [
        {
          actorUserId: user.id,
          action: "VEHICLE_OFFER_SELECTED",
          entityType: "VehicleOffer",
          entityId: offer.id,
          metadata: {
            requestId: offer.requestId,
            companyId: offer.companyId
          }
        },
        {
          actorUserId: user.id,
          action: "CONTACT_REVEALED",
          entityType: "ContactReveal",
          entityId: reveal.id,
          metadata: {
            requestId: offer.requestId,
            offerId: offer.id,
            companyId: offer.companyId
          }
        }
      ]
    });

    return {
      selectedOffer,
      vehicleRequest: updatedRequest,
      contactReveal: reveal
    };
  });

  return {
    selectedOffer: withDisplayVehicle(result.selectedOffer),
    vehicleRequest: result.vehicleRequest,
    contactReveal: result.contactReveal
  };
}

export async function getCompanyRequestContact(user: AuthenticatedUser, requestId: string) {
  const company = await getUserCompany(user);
  const request = await prisma.vehicleRequest.findFirst({
    where: {
      id: requestId,
      OR: [
        { status: { in: COMPANY_VISIBLE_REQUEST_STATUSES } },
        {
          status: VehicleRequestStatus.COMPANY_SELECTED,
          contactReveal: { companyId: company.id }
        }
      ]
    },
    select: { id: true }
  });

  if (!request) {
    throw new AppError("Vehicle request not found", 404, "VEHICLE_REQUEST_NOT_FOUND");
  }

  const reveal = await prisma.contactReveal.findUnique({
    where: { requestId },
    select: {
      id: true,
      requestId: true,
      offerId: true,
      companyId: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      consentText: true,
      createdAt: true
    }
  });

  if (!reveal || reveal.companyId !== company.id) {
    throw new AppError("Contact is not available for this company", 403, "CONTACT_NOT_AVAILABLE");
  }

  return reveal;
}

export async function listAdminOffers(user: AuthenticatedUser) {
  assertAdminRole(user);

  const offers = await prisma.vehicleOffer.findMany({
    orderBy: { createdAt: "desc" },
    include: offerInclude
  });

  return offers.map(withDisplayVehicle);
}

const contactRevealInclude = {
  company: {
    select: {
      id: true,
      publicName: true
    }
  },
  offer: {
    include: offerInclude
  },
  request: {
    select: {
      id: true,
      status: true
    }
  }
} satisfies Prisma.ContactRevealInclude;

export async function listAdminContactReveals(user: AuthenticatedUser) {
  assertAdminRole(user);

  return prisma.contactReveal.findMany({
    orderBy: { createdAt: "desc" },
    include: contactRevealInclude
  });
}

export async function getAdminContactReveal(user: AuthenticatedUser, revealId: string) {
  assertAdminRole(user);

  const reveal = await prisma.contactReveal.findUnique({
    where: { id: revealId },
    include: contactRevealInclude
  });

  if (!reveal) {
    throw new AppError("Contact reveal not found", 404, "CONTACT_REVEAL_NOT_FOUND");
  }

  return reveal;
}

export async function getAdminOffer(user: AuthenticatedUser, offerId: string) {
  assertAdminRole(user);

  const offer = await prisma.vehicleOffer.findUnique({
    where: { id: offerId },
    include: offerInclude
  });

  if (!offer) {
    throw new AppError("Vehicle offer not found", 404, "VEHICLE_OFFER_NOT_FOUND");
  }

  return withDisplayVehicle(offer);
}
