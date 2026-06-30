import {
  ChargerNeed,
  CompanyStatus,
  ContactReveal,
  FinancingInterest,
  HasSolar,
  Prisma,
  SolarChargingInterest,
  UserRole,
  VehicleOfferStatus,
  VehicleRequestStatus
} from "@prisma/client";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { AppError } from "../../middleware/errorHandler.js";
import { prisma } from "../../prisma.js";

export type AdminReportFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  fuelType?: string;
  makeId?: string;
  modelId?: string;
};

type CountRow = {
  key: string;
  count: number;
};

const ADMIN_ROLES = new Set<UserRole>([UserRole.PLATFORM_ADMIN, UserRole.SUPPORT]);

function assertAdminRole(user: AuthenticatedUser) {
  if (!ADMIN_ROLES.has(user.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function dateRange(filters: AdminReportFilters): Prisma.DateTimeFilter | undefined {
  if (!filters.dateFrom && !filters.dateTo) {
    return undefined;
  }

  return {
    ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
    ...(filters.dateTo ? { lte: filters.dateTo } : {})
  };
}

function requestWhere(filters: AdminReportFilters): Prisma.VehicleRequestWhereInput {
  return {
    ...(dateRange(filters) ? { createdAt: dateRange(filters) } : {}),
    ...(filters.fuelType ? { fuelType: filters.fuelType as never } : {}),
    ...(filters.makeId ? { makeId: filters.makeId } : {}),
    ...(filters.modelId ? { modelId: filters.modelId } : {})
  };
}

function offerWhere(filters: AdminReportFilters): Prisma.VehicleOfferWhereInput {
  return {
    ...(dateRange(filters) ? { createdAt: dateRange(filters) } : {}),
    ...(filters.fuelType ? { fuelType: filters.fuelType as never } : {}),
    ...(filters.makeId ? { makeId: filters.makeId } : {}),
    ...(filters.modelId ? { modelId: filters.modelId } : {})
  };
}

function userWhere(filters: AdminReportFilters): Prisma.UserWhereInput {
  return dateRange(filters) ? { createdAt: dateRange(filters) } : {};
}

function companyWhere(filters: AdminReportFilters): Prisma.CompanyWhereInput {
  return dateRange(filters) ? { createdAt: dateRange(filters) } : {};
}

function contactRevealWhere(filters: AdminReportFilters): Prisma.ContactRevealWhereInput {
  return {
    ...(dateRange(filters) ? { createdAt: dateRange(filters) } : {}),
    ...(filters.fuelType || filters.makeId || filters.modelId
      ? {
          offer: {
            ...(filters.fuelType ? { fuelType: filters.fuelType as never } : {}),
            ...(filters.makeId ? { makeId: filters.makeId } : {}),
            ...(filters.modelId ? { modelId: filters.modelId } : {})
          }
        }
      : {})
  };
}

function countBy<T extends string | null>(values: T[]): CountRow[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = value ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

async function groupRequestBy(field: Prisma.VehicleRequestScalarFieldEnum, filters: AdminReportFilters) {
  const rows = await prisma.vehicleRequest.groupBy({
    by: [field],
    where: requestWhere(filters),
    _count: { _all: true },
    orderBy: { _count: { [field]: "desc" } }
  });

  return rows.map((row) => ({ key: String(row[field] ?? "unknown"), count: row._count._all }));
}

async function groupOfferBy(field: Prisma.VehicleOfferScalarFieldEnum, filters: AdminReportFilters) {
  const rows = await prisma.vehicleOffer.groupBy({
    by: [field],
    where: offerWhere(filters),
    _count: { _all: true },
    orderBy: { _count: { [field]: "desc" } }
  });

  return rows.map((row) => ({ key: String(row[field] ?? "unknown"), count: row._count._all }));
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 10_000) / 100 : 0;
}

function median(values: number[]) {
  if (!values.length) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2) {
    return sorted[middle];
  }

  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function average(values: number[]) {
  if (!values.length) {
    return null;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

async function requestsWithOfferCounts(filters: AdminReportFilters) {
  return prisma.vehicleRequest.findMany({
    where: requestWhere(filters),
    select: {
      id: true,
      _count: {
        select: { offers: true }
      }
    }
  });
}

export async function getAdminOverviewReport(user: AuthenticatedUser, filters: AdminReportFilters) {
  assertAdminRole(user);

  const requests = await requestsWithOfferCounts(filters);
  const requestsWithAtLeastOneOffer = requests.filter((request) => request._count.offers >= 1).length;
  const requestsWithThreeOrMoreOffers = requests.filter((request) => request._count.offers >= 3).length;
  const totalVehicleRequests = requests.length;

  const [
    totalUsers,
    totalCustomers,
    totalCompanies,
    activeCompanies,
    pendingCompanies,
    submittedRequests,
    activeRequests,
    offersReceivedRequests,
    companySelectedRequests,
    closedSuccessfullyRequests,
    totalOffers,
    selectedOffers,
    withdrawnOffers,
    contactReveals
  ] = await Promise.all([
    prisma.user.count({ where: userWhere(filters) }),
    prisma.user.count({ where: { ...userWhere(filters), role: UserRole.CUSTOMER } }),
    prisma.company.count({ where: companyWhere(filters) }),
    prisma.company.count({ where: { ...companyWhere(filters), status: CompanyStatus.ACTIVE } }),
    prisma.company.count({ where: { ...companyWhere(filters), status: CompanyStatus.PENDING } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), status: VehicleRequestStatus.SUBMITTED } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), status: VehicleRequestStatus.ACTIVE } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), status: VehicleRequestStatus.OFFERS_RECEIVED } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), status: VehicleRequestStatus.COMPANY_SELECTED } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), status: VehicleRequestStatus.CLOSED_SUCCESSFULLY } }),
    prisma.vehicleOffer.count({ where: offerWhere(filters) }),
    prisma.vehicleOffer.count({ where: { ...offerWhere(filters), status: VehicleOfferStatus.SELECTED } }),
    prisma.vehicleOffer.count({ where: { ...offerWhere(filters), status: VehicleOfferStatus.WITHDRAWN } }),
    prisma.contactReveal.count({ where: contactRevealWhere(filters) })
  ]);

  return {
    totalUsers,
    totalCustomers,
    totalCompanies,
    activeCompanies,
    pendingCompanies,
    totalVehicleRequests,
    submittedRequests,
    activeRequests,
    offersReceivedRequests,
    companySelectedRequests,
    closedSuccessfullyRequests,
    totalOffers,
    selectedOffers,
    withdrawnOffers,
    contactReveals,
    averageOffersPerRequest: totalVehicleRequests > 0 ? Math.round((totalOffers / totalVehicleRequests) * 100) / 100 : 0,
    requestsWithAtLeastOneOffer,
    requestsWithThreeOrMoreOffers
  };
}

export async function getAdminFunnelReport(user: AuthenticatedUser, filters: AdminReportFilters) {
  assertAdminRole(user);

  const requests = await requestsWithOfferCounts(filters);
  const requestsCreated = requests.length;
  const requestsWithOffers = requests.filter((request) => request._count.offers >= 1).length;
  const requestsWithThreeOrMoreOffers = requests.filter((request) => request._count.offers >= 3).length;

  const [requestsApprovedActive, requestsWithSelectedOffer, contactReveals, closedSuccessfully, closedWithoutPurchase] =
    await Promise.all([
      prisma.vehicleRequest.count({
        where: {
          ...requestWhere(filters),
          status: {
            in: [
              VehicleRequestStatus.ACTIVE,
              VehicleRequestStatus.OFFERS_RECEIVED,
              VehicleRequestStatus.CUSTOMER_DECIDING,
              VehicleRequestStatus.COMPANY_SELECTED,
              VehicleRequestStatus.CLOSED_SUCCESSFULLY,
              VehicleRequestStatus.CLOSED_WITHOUT_PURCHASE
            ]
          }
        }
      }),
      prisma.vehicleOffer.count({ where: { ...offerWhere(filters), status: VehicleOfferStatus.SELECTED } }),
      prisma.contactReveal.count({ where: contactRevealWhere(filters) }),
      prisma.vehicleRequest.count({ where: { ...requestWhere(filters), status: VehicleRequestStatus.CLOSED_SUCCESSFULLY } }),
      prisma.vehicleRequest.count({ where: { ...requestWhere(filters), status: VehicleRequestStatus.CLOSED_WITHOUT_PURCHASE } })
    ]);

  const counts = {
    requestsCreated,
    requestsApprovedActive,
    requestsWithOffers,
    requestsWithThreeOrMoreOffers,
    requestsWithSelectedOffer,
    contactReveals,
    closedSuccessfully,
    closedWithoutPurchase
  };

  return {
    counts,
    conversions: {
      approvedFromCreated: percentage(requestsApprovedActive, requestsCreated),
      offersFromApproved: percentage(requestsWithOffers, requestsApprovedActive),
      threeOrMoreOffersFromWithOffers: percentage(requestsWithThreeOrMoreOffers, requestsWithOffers),
      selectedFromWithOffers: percentage(requestsWithSelectedOffer, requestsWithOffers),
      contactRevealFromSelected: percentage(contactReveals, requestsWithSelectedOffer),
      closedSuccessfullyFromSelected: percentage(closedSuccessfully, requestsWithSelectedOffer),
      closedWithoutPurchaseFromSelected: percentage(closedWithoutPurchase, requestsWithSelectedOffer)
    }
  };
}

export async function getAdminDemandReport(user: AuthenticatedUser, filters: AdminReportFilters) {
  assertAdminRole(user);

  const requests = await prisma.vehicleRequest.findMany({
    where: requestWhere(filters),
    select: {
      budgetMin: true,
      budgetMax: true,
      manualMake: true,
      manualModel: true,
      make: { select: { name: true } },
      model: { select: { name: true } }
    }
  });

  const makeNames = requests.map((request) => request.make?.name ?? request.manualMake ?? null);
  const modelNames = requests.map((request) => {
    const makeName = request.make?.name ?? request.manualMake ?? null;
    const modelName = request.model?.name ?? request.manualModel ?? null;
    return makeName && modelName ? `${makeName} ${modelName}` : modelName;
  });

  const budgetDistribution = {
    under15000: 0,
    "15000to25000": 0,
    "25000to40000": 0,
    "40000plus": 0,
    unknown: 0
  };

  for (const request of requests) {
    const budget = request.budgetMax ?? request.budgetMin;

    if (!budget) {
      budgetDistribution.unknown += 1;
    } else if (budget < 15_000) {
      budgetDistribution.under15000 += 1;
    } else if (budget <= 25_000) {
      budgetDistribution["15000to25000"] += 1;
    } else if (budget <= 40_000) {
      budgetDistribution["25000to40000"] += 1;
    } else {
      budgetDistribution["40000plus"] += 1;
    }
  }

  const [
    requestsByFuelType,
    requestsByMode,
    requestsByBodyType,
    requestsByConditionPreference,
    requestsByFinancingInterest,
    requestsByChargerNeed,
    requestsByHasSolar,
    requestsBySolarChargingInterest
  ] = await Promise.all([
    groupRequestBy(Prisma.VehicleRequestScalarFieldEnum.fuelType, filters),
    groupRequestBy(Prisma.VehicleRequestScalarFieldEnum.requestMode, filters),
    groupRequestBy(Prisma.VehicleRequestScalarFieldEnum.bodyType, filters),
    groupRequestBy(Prisma.VehicleRequestScalarFieldEnum.conditionPreference, filters),
    groupRequestBy(Prisma.VehicleRequestScalarFieldEnum.financingInterest, filters),
    groupRequestBy(Prisma.VehicleRequestScalarFieldEnum.chargerNeeded, filters),
    groupRequestBy(Prisma.VehicleRequestScalarFieldEnum.hasSolar, filters),
    groupRequestBy(Prisma.VehicleRequestScalarFieldEnum.solarChargingInterest, filters)
  ]);

  return {
    requestsByFuelType,
    requestsByMode,
    requestsByBodyType,
    requestsByConditionPreference,
    requestsByFinancingInterest,
    requestsByChargerNeed,
    requestsByHasSolar,
    requestsBySolarChargingInterest,
    topRequestedMakes: countBy(makeNames).slice(0, 10),
    topRequestedModels: countBy(modelNames).slice(0, 10),
    budgetDistribution
  };
}

export async function getAdminOffersReport(user: AuthenticatedUser, filters: AdminReportFilters) {
  assertAdminRole(user);

  const offers = await prisma.vehicleOffer.findMany({
    where: offerWhere(filters),
    select: {
      currency: true,
      priceAmount: true,
      estimatedDeliveryDaysMin: true,
      estimatedDeliveryDaysMax: true,
      financingAvailable: true,
      chargerIncluded: true,
      tradeInAccepted: true,
      warrantyMonths: true,
      batteryWarrantyMonths: true,
      advancePaymentRequired: true,
      manualMake: true,
      manualModel: true,
      make: { select: { name: true } },
      model: { select: { name: true } }
    }
  });

  const pricesByCurrency = new Map<string, number[]>();
  const deliveryDayValues: number[] = [];
  const makeNames = offers.map((offer) => offer.make?.name ?? offer.manualMake ?? null);
  const modelNames = offers.map((offer) => {
    const makeName = offer.make?.name ?? offer.manualMake ?? null;
    const modelName = offer.model?.name ?? offer.manualModel ?? null;
    return makeName && modelName ? `${makeName} ${modelName}` : modelName;
  });

  for (const offer of offers) {
    const prices = pricesByCurrency.get(offer.currency) ?? [];
    prices.push(offer.priceAmount);
    pricesByCurrency.set(offer.currency, prices);

    if (offer.estimatedDeliveryDaysMin && offer.estimatedDeliveryDaysMax) {
      deliveryDayValues.push((offer.estimatedDeliveryDaysMin + offer.estimatedDeliveryDaysMax) / 2);
    } else if (offer.estimatedDeliveryDaysMin) {
      deliveryDayValues.push(offer.estimatedDeliveryDaysMin);
    } else if (offer.estimatedDeliveryDaysMax) {
      deliveryDayValues.push(offer.estimatedDeliveryDaysMax);
    }
  }

  const [
    offersByType,
    offersByAvailabilityStatus,
    offersByCondition,
    offersBySourceMarket,
    offersByCurrency,
    offersByChargingPortType,
    offersByBatteryChemistry,
    selectedOfferCount
  ] = await Promise.all([
    groupOfferBy(Prisma.VehicleOfferScalarFieldEnum.offerType, filters),
    groupOfferBy(Prisma.VehicleOfferScalarFieldEnum.availabilityStatus, filters),
    groupOfferBy(Prisma.VehicleOfferScalarFieldEnum.condition, filters),
    groupOfferBy(Prisma.VehicleOfferScalarFieldEnum.sourceMarket, filters),
    groupOfferBy(Prisma.VehicleOfferScalarFieldEnum.currency, filters),
    groupOfferBy(Prisma.VehicleOfferScalarFieldEnum.chargingPortType, filters),
    groupOfferBy(Prisma.VehicleOfferScalarFieldEnum.batteryChemistry, filters),
    prisma.vehicleOffer.count({ where: { ...offerWhere(filters), status: VehicleOfferStatus.SELECTED } })
  ]);

  return {
    offersByType,
    offersByAvailabilityStatus,
    offersByCondition,
    offersBySourceMarket,
    offersByCurrency,
    offersByChargingPortType,
    offersByBatteryChemistry,
    offersWithFinancing: offers.filter((offer) => offer.financingAvailable).length,
    offersWithCharger: offers.filter((offer) => offer.chargerIncluded).length,
    offersWithTradeIn: offers.filter((offer) => offer.tradeInAccepted).length,
    offersWithWarranty: offers.filter((offer) => offer.warrantyMonths !== null && offer.warrantyMonths > 0).length,
    offersWithBatteryWarranty: offers.filter((offer) => offer.batteryWarrantyMonths !== null && offer.batteryWarrantyMonths > 0).length,
    offersWithAdvancePayment: offers.filter((offer) => offer.advancePaymentRequired).length,
    selectedOfferCount,
    medianPriceByCurrency: [...pricesByCurrency.entries()].map(([currency, values]) => ({ currency, medianPrice: median(values) })),
    averageDeliveryDays: average(deliveryDayValues),
    topOfferedMakes: countBy(makeNames).slice(0, 10),
    topOfferedModels: countBy(modelNames).slice(0, 10)
  };
}

export async function getAdminCompaniesReport(user: AuthenticatedUser, filters: AdminReportFilters) {
  assertAdminRole(user);

  const companies = await prisma.company.findMany({
    where: companyWhere(filters),
    select: {
      id: true,
      publicName: true,
      status: true,
      type: true
    }
  });

  const offerRows = await prisma.vehicleOffer.findMany({
    where: offerWhere(filters),
    select: {
      id: true,
      companyId: true,
      requestId: true,
      status: true,
      createdAt: true,
      request: { select: { createdAt: true } }
    }
  });

  const contactRevealRows = await prisma.contactReveal.findMany({
    where: contactRevealWhere(filters),
    select: { companyId: true }
  });

  const contactRevealsByCompany = countBy(contactRevealRows.map((row) => row.companyId)).reduce<Record<string, number>>(
    (accumulator, row) => ({ ...accumulator, [row.key]: row.count }),
    {}
  );

  const rows = companies.map((company) => {
    const companyOffers = offerRows.filter((offer) => offer.companyId === company.id);
    const selectedOffers = companyOffers.filter((offer) => offer.status === VehicleOfferStatus.SELECTED).length;
    const withdrawnOffers = companyOffers.filter((offer) => offer.status === VehicleOfferStatus.WITHDRAWN).length;
    const quotedRequestIds = new Set(companyOffers.map((offer) => offer.requestId));
    const firstOffersByRequest = new Map<string, (typeof companyOffers)[number]>();

    for (const offer of companyOffers) {
      const existingOffer = firstOffersByRequest.get(offer.requestId);

      if (!existingOffer || offer.createdAt < existingOffer.createdAt) {
        firstOffersByRequest.set(offer.requestId, offer);
      }
    }

    const responseHours = [...firstOffersByRequest.values()].map((offer) => {
      const milliseconds = offer.createdAt.getTime() - offer.request.createdAt.getTime();
      return Math.max(0, milliseconds / 3_600_000);
    });

    return {
      companyId: company.id,
      publicName: company.publicName,
      status: company.status,
      type: company.type,
      offersSubmitted: companyOffers.length,
      selectedOffers,
      withdrawnOffers,
      contactReveals: contactRevealsByCompany[company.id] ?? 0,
      requestsQuoted: quotedRequestIds.size,
      selectionRate: percentage(selectedOffers, companyOffers.length),
      averageResponseTimeHours: average(responseHours)
    };
  });

  return rows.sort(
    (left, right) =>
      right.selectedOffers - left.selectedOffers ||
      right.offersSubmitted - left.offersSubmitted ||
      left.publicName.localeCompare(right.publicName)
  );
}

export async function getAdminSolarEvReport(user: AuthenticatedUser, filters: AdminReportFilters) {
  assertAdminRole(user);

  const totalRequests = await prisma.vehicleRequest.count({ where: requestWhere(filters) });
  const [
    requestsWithSolar,
    requestsPlanningSolar,
    requestsNoSolar,
    requestsUnknownSolar,
    solarChargingYes,
    solarChargingMaybeLater,
    solarChargingNo,
    chargerNeededYes,
    chargerNeededNo,
    chargerNeededNotSure
  ] = await Promise.all([
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), hasSolar: HasSolar.YES } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), hasSolar: HasSolar.PLANNING } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), hasSolar: HasSolar.NO } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), hasSolar: HasSolar.UNKNOWN } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), solarChargingInterest: SolarChargingInterest.YES } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), solarChargingInterest: SolarChargingInterest.MAYBE_LATER } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), solarChargingInterest: SolarChargingInterest.NO } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), chargerNeeded: ChargerNeed.YES } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), chargerNeeded: ChargerNeed.NO } }),
    prisma.vehicleRequest.count({ where: { ...requestWhere(filters), chargerNeeded: ChargerNeed.NOT_SURE } })
  ]);

  return {
    requestsWithSolar,
    requestsPlanningSolar,
    requestsNoSolar,
    requestsUnknownSolar,
    solarChargingYes,
    solarChargingMaybeLater,
    solarChargingNo,
    chargerNeededYes,
    chargerNeededNo,
    chargerNeededNotSure,
    percentageSolarOrPlanning: percentage(requestsWithSolar + requestsPlanningSolar, totalRequests),
    percentageInterestedInSolarCharging: percentage(solarChargingYes + solarChargingMaybeLater, totalRequests)
  };
}
