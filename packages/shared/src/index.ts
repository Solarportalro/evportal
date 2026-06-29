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

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
  code?: string;
  details?: Record<string, unknown>;
};
