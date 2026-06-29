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

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
};
