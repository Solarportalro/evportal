import type { ApiResponse } from "@evportal/shared";
import { getAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export type ReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  fuelType?: string;
  makeId?: string;
  modelId?: string;
};

export type CountRow = {
  key: string;
  count: number;
};

export type OverviewReport = {
  totalUsers: number;
  totalCustomers: number;
  totalCompanies: number;
  activeCompanies: number;
  pendingCompanies: number;
  totalVehicleRequests: number;
  submittedRequests: number;
  activeRequests: number;
  offersReceivedRequests: number;
  companySelectedRequests: number;
  closedSuccessfullyRequests: number;
  totalOffers: number;
  selectedOffers: number;
  withdrawnOffers: number;
  contactReveals: number;
  averageOffersPerRequest: number;
  requestsWithAtLeastOneOffer: number;
  requestsWithThreeOrMoreOffers: number;
};

export type FunnelReport = {
  counts: Record<string, number>;
  conversions: Record<string, number>;
};

export type DemandReport = {
  requestsByFuelType: CountRow[];
  requestsByMode: CountRow[];
  requestsByBodyType: CountRow[];
  requestsByConditionPreference: CountRow[];
  requestsByFinancingInterest: CountRow[];
  requestsByChargerNeed: CountRow[];
  requestsByHasSolar: CountRow[];
  requestsBySolarChargingInterest: CountRow[];
  topRequestedMakes: CountRow[];
  topRequestedModels: CountRow[];
  budgetDistribution: Record<string, number>;
};

export type OffersReport = {
  offersByType: CountRow[];
  offersByAvailabilityStatus: CountRow[];
  offersByCondition: CountRow[];
  offersBySourceMarket: CountRow[];
  offersByCurrency: CountRow[];
  offersByChargingPortType: CountRow[];
  offersByBatteryChemistry: CountRow[];
  offersWithFinancing: number;
  offersWithCharger: number;
  offersWithTradeIn: number;
  offersWithWarranty: number;
  offersWithBatteryWarranty: number;
  offersWithAdvancePayment: number;
  selectedOfferCount: number;
  medianPriceByCurrency: Array<{ currency: string; medianPrice: number | null }>;
  averageDeliveryDays: number | null;
  topOfferedMakes: CountRow[];
  topOfferedModels: CountRow[];
};

export type CompanyPerformanceRow = {
  companyId: string;
  publicName: string;
  status: string;
  type: string;
  offersSubmitted: number;
  selectedOffers: number;
  withdrawnOffers: number;
  contactReveals: number;
  requestsQuoted: number;
  selectionRate: number;
  averageResponseTimeHours: number | null;
};

export type SolarEvReport = {
  requestsWithSolar: number;
  requestsPlanningSolar: number;
  requestsNoSolar: number;
  requestsUnknownSolar: number;
  solarChargingYes: number;
  solarChargingMaybeLater: number;
  solarChargingNo: number;
  chargerNeededYes: number;
  chargerNeededNo: number;
  chargerNeededNotSure: number;
  percentageSolarOrPlanning: number;
  percentageInterestedInSolarCharging: number;
};

export type AdminReports = {
  overview: OverviewReport;
  funnel: FunnelReport;
  demand: DemandReport;
  offers: OffersReport;
  companies: CompanyPerformanceRow[];
  solarEv: SolarEvReport;
};

async function adminReportRequest<T>(path: string, filters: ReportFilters): Promise<T> {
  const accessToken = getAccessToken();
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}${path}${query ? `?${query}` : ""}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload.data as T;
}

export async function getAdminReports(filters: ReportFilters = {}): Promise<AdminReports> {
  const [overview, funnel, demand, offers, companies, solarEv] = await Promise.all([
    adminReportRequest<{ overview: OverviewReport }>("/admin/reports/overview", filters),
    adminReportRequest<{ funnel: FunnelReport }>("/admin/reports/funnel", filters),
    adminReportRequest<{ demand: DemandReport }>("/admin/reports/demand", filters),
    adminReportRequest<{ offers: OffersReport }>("/admin/reports/offers", filters),
    adminReportRequest<{ companies: CompanyPerformanceRow[] }>("/admin/reports/companies", filters),
    adminReportRequest<{ solarEv: SolarEvReport }>("/admin/reports/solar-ev", filters)
  ]);

  return {
    overview: overview.overview,
    funnel: funnel.funnel,
    demand: demand.demand,
    offers: offers.offers,
    companies: companies.companies,
    solarEv: solarEv.solarEv
  };
}
