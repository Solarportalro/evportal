export enum UserRole {
  CUSTOMER = "CUSTOMER",
  COMPANY_USER = "COMPANY_USER",
  COMPANY_ADMIN = "COMPANY_ADMIN",
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
  SUPPORT = "SUPPORT"
}

export enum CompanyType {
  STOCK_SELLER = "STOCK_SELLER",
  IMPORTER = "IMPORTER",
  OFFICIAL_DEALER = "OFFICIAL_DEALER",
  BROKER = "BROKER",
  MIXED = "MIXED"
}

export enum CompanyStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  REJECTED = "REJECTED"
}

export enum VehicleFuelType {
  ELECTRIC = "ELECTRIC",
  PLUG_IN_HYBRID = "PLUG_IN_HYBRID",
  HYBRID = "HYBRID",
  GASOLINE = "GASOLINE",
  DIESEL = "DIESEL"
}

export enum VehicleRequestMode {
  EXACT_MODEL = "EXACT_MODEL",
  RECOMMENDATION = "RECOMMENDATION"
}

export enum VehicleRequestStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  ACTIVE = "ACTIVE",
  OFFERS_RECEIVED = "OFFERS_RECEIVED",
  CUSTOMER_DECIDING = "CUSTOMER_DECIDING",
  COMPANY_SELECTED = "COMPANY_SELECTED",
  CLOSED_SUCCESSFULLY = "CLOSED_SUCCESSFULLY",
  CLOSED_WITHOUT_PURCHASE = "CLOSED_WITHOUT_PURCHASE",
  EXPIRED = "EXPIRED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export enum VehicleBodyType {
  SMALL_HATCHBACK = "SMALL_HATCHBACK",
  SEDAN = "SEDAN",
  SUV_CROSSOVER = "SUV_CROSSOVER",
  VAN_BUSINESS = "VAN_BUSINESS",
  OTHER = "OTHER"
}

export enum StockImportPreference {
  IN_STOCK_ONLY = "IN_STOCK_ONLY",
  IMPORT_OK = "IMPORT_OK",
  BOTH = "BOTH",
  NOT_SURE = "NOT_SURE"
}

export enum PurchaseTimeline {
  ASAP = "ASAP",
  ONE_TO_THREE_MONTHS = "ONE_TO_THREE_MONTHS",
  JUST_EXPLORING = "JUST_EXPLORING"
}

export enum HasSolar {
  YES = "YES",
  NO = "NO",
  PLANNING = "PLANNING",
  UNKNOWN = "UNKNOWN"
}

export enum SolarChargingInterest {
  YES = "YES",
  MAYBE_LATER = "MAYBE_LATER",
  NO = "NO",
  NOT_ASKED = "NOT_ASKED"
}

export enum VehicleOfferType {
  IN_STOCK = "IN_STOCK",
  IMPORT_ORDER = "IMPORT_ORDER",
  ALTERNATIVE_RECOMMENDATION = "ALTERNATIVE_RECOMMENDATION"
}

export enum VehicleOfferStatus {
  SUBMITTED = "SUBMITTED",
  UPDATED = "UPDATED",
  WITHDRAWN = "WITHDRAWN",
  SELECTED = "SELECTED",
  REJECTED_BY_CUSTOMER = "REJECTED_BY_CUSTOMER",
  EXPIRED = "EXPIRED"
}

export enum VehicleAvailabilityStatus {
  IN_ARMENIA = "IN_ARMENIA",
  IN_TRANSIT = "IN_TRANSIT",
  IMPORT_REQUIRED = "IMPORT_REQUIRED"
}

export enum OfferCurrency {
  AMD = "AMD",
  USD = "USD",
  EUR = "EUR"
}

export type VehicleMake = {
  id: string;
  name: string;
  slug: string;
};

export type VehicleModel = {
  id: string;
  makeId: string;
  name: string;
  slug: string;
};

export type CompanyProfile = {
  id: string;
  publicName: string;
  legalName: string | null;
  type: CompanyType;
  status: CompanyStatus;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  taxId: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  contactPersonEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleOffer = {
  id: string;
  requestId: string;
  companyId: string;
  submittedByUserId: string;
  offerType: VehicleOfferType;
  status: VehicleOfferStatus;
  makeId: string | null;
  modelId: string | null;
  manualMake: string | null;
  manualModel: string | null;
  displayMake: string | null;
  displayModel: string | null;
  year: number | null;
  trim: string | null;
  fuelType: VehicleFuelType;
  batteryCapacityKwh: number | null;
  rangeKm: number | null;
  mileageKm: number | null;
  color: string | null;
  availabilityStatus: VehicleAvailabilityStatus;
  sourceCountry: string | null;
  estimatedDeliveryDaysMin: number | null;
  estimatedDeliveryDaysMax: number | null;
  priceAmount: number;
  currency: OfferCurrency;
  priceIncludesCustoms: boolean;
  priceIncludesRegistration: boolean;
  priceIncludesDeliveryToArmenia: boolean;
  priceIncludesDealerFee: boolean;
  priceIsFinal: boolean;
  advancePaymentRequired: boolean;
  advancePaymentAmount: number | null;
  advancePaymentRefundable: boolean | null;
  warrantyMonths: number | null;
  batteryWarrantyMonths: number | null;
  warrantyProvider: string | null;
  serviceSupportIncluded: boolean;
  chargerIncluded: boolean;
  financingAvailable: boolean;
  tradeInAccepted: boolean;
  offerValidUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactReveal = {
  id: string;
  requestId: string;
  offerId: string;
  companyId: string;
  customerId: string;
  revealedToUserId: string | null;
  consentText: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  createdAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
  code?: string;
  details?: Record<string, unknown>;
};
