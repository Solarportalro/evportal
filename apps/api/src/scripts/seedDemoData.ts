import {
  ChargerNeed,
  CompanyStatus,
  CompanyType,
  FinancingInterest,
  HasSolar,
  OfferCurrency,
  PurchaseTimeline,
  PrismaClient,
  SolarChargingInterest,
  StockImportPreference,
  UserRole,
  VehicleAvailabilityStatus,
  VehicleBodyType,
  VehicleCondition,
  VehicleConditionPreference,
  VehicleFuelType,
  VehicleOfferStatus,
  VehicleOfferType,
  VehicleRequestMode,
  VehicleRequestStatus
} from "@prisma/client";
import { vehicleCatalogSeed } from "../modules/vehicle-catalog/data.js";
import { normalizeArmenianPhone, normalizeEmail } from "../utils/identity.js";
import { hashPassword } from "../utils/security.js";
import { toSlug } from "../utils/slug.js";

process.env.DATABASE_URL ??= "postgresql://evportal:evportal_dev_password@localhost:5432/evportal_dev?schema=public";

const prisma = new PrismaClient();

const demoAccounts = {
  admin: { email: "admin@evportal.local", password: "Admin12345!", role: UserRole.PLATFORM_ADMIN, fullName: "Demo Platform Admin" },
  customer: {
    email: "customer@evportal.local",
    password: "Customer12345!",
    phone: "+37491111000",
    role: UserRole.CUSTOMER,
    fullName: "Demo Customer"
  },
  company1: { email: "company1@evportal.local", password: "Company12345!", role: UserRole.COMPANY_ADMIN, fullName: "EV Import Manager" },
  company2: { email: "company2@evportal.local", password: "Company12345!", role: UserRole.COMPANY_ADMIN, fullName: "Green Auto Manager" },
  company3: { email: "company3@evportal.local", password: "Company12345!", role: UserRole.COMPANY_ADMIN, fullName: "Hybrid Motors Manager" }
};

async function upsertGlobalCustomer(input: { email: string; phone?: string; fullName: string }) {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizeArmenianPhone(input.phone);

  if (!normalizedEmail) {
    throw new Error(`Invalid demo email: ${input.email}`);
  }

  const existing = await prisma.globalCustomer.findUnique({ where: { normalizedEmail } });

  if (existing) {
    return prisma.globalCustomer.update({
      where: { id: existing.id },
      data: {
        normalizedPhone: existing.normalizedPhone ?? normalizedPhone,
        fullName: input.fullName
      }
    });
  }

  return prisma.globalCustomer.create({
    data: {
      normalizedEmail,
      normalizedPhone,
      fullName: input.fullName
    }
  });
}

async function upsertUser(input: { email: string; password: string; phone?: string; role: UserRole; fullName: string }) {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizeArmenianPhone(input.phone);

  if (!normalizedEmail) {
    throw new Error(`Invalid demo email: ${input.email}`);
  }

  const globalCustomer = await upsertGlobalCustomer(input);
  const passwordHash = await hashPassword(input.password);

  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      globalCustomerId: globalCustomer.id,
      email: normalizedEmail,
      phone: input.phone,
      normalizedEmail,
      normalizedPhone,
      passwordHash,
      role: input.role,
      isActive: true,
      disabledAt: null,
      disabledReason: null
    },
    create: {
      globalCustomerId: globalCustomer.id,
      email: normalizedEmail,
      phone: input.phone,
      normalizedEmail,
      normalizedPhone,
      passwordHash,
      role: input.role,
      preferredLanguage: "hy",
      isActive: true
    }
  });
}

async function upsertCompany(input: {
  publicName: string;
  type: CompanyType;
  status: CompanyStatus;
  user: Awaited<ReturnType<typeof upsertUser>>;
}) {
  const existing = await prisma.company.findFirst({ where: { publicName: input.publicName } });
  const company = existing
    ? await prisma.company.update({
        where: { id: existing.id },
        data: {
          publicName: input.publicName,
          type: input.type,
          status: input.status,
          email: input.user.email,
          contactPersonEmail: input.user.email,
          contactPersonName: input.user.email?.split("@")[0] ?? input.publicName
        }
      })
    : await prisma.company.create({
        data: {
          publicName: input.publicName,
          type: input.type,
          status: input.status,
          email: input.user.email,
          contactPersonEmail: input.user.email,
          contactPersonName: input.user.email?.split("@")[0] ?? input.publicName,
          city: "Yerevan"
        }
      });

  await prisma.companyMember.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: input.user.id
      }
    },
    update: { role: UserRole.COMPANY_ADMIN },
    create: {
      companyId: company.id,
      userId: input.user.id,
      role: UserRole.COMPANY_ADMIN
    }
  });

  return company;
}

async function seedVehicleCatalog() {
  for (const item of vehicleCatalogSeed) {
    const make = await prisma.vehicleMake.upsert({
      where: { slug: toSlug(item.make) },
      update: { name: item.make, isActive: true },
      create: { name: item.make, slug: toSlug(item.make), isActive: true }
    });

    for (const modelName of item.models) {
      await prisma.vehicleModel.upsert({
        where: {
          makeId_slug: {
            makeId: make.id,
            slug: toSlug(modelName)
          }
        },
        update: { name: modelName, isActive: true },
        create: {
          makeId: make.id,
          name: modelName,
          slug: toSlug(modelName),
          isActive: true
        }
      });
    }
  }
}

async function getCatalogVehicle(makeName: string, modelName: string) {
  const make = await prisma.vehicleMake.findUnique({ where: { slug: toSlug(makeName) } });

  if (!make) {
    throw new Error(`Missing demo make: ${makeName}`);
  }

  const model = await prisma.vehicleModel.findUnique({
    where: {
      makeId_slug: {
        makeId: make.id,
        slug: toSlug(modelName)
      }
    }
  });

  if (!model) {
    throw new Error(`Missing demo model: ${makeName} ${modelName}`);
  }

  return { make, model };
}

async function upsertDemoRequest(input: {
  customerId: string;
  noteKey: string;
  data: Parameters<typeof prisma.vehicleRequest.create>[0]["data"];
}) {
  const existing = await prisma.vehicleRequest.findFirst({
    where: {
      customerId: input.customerId,
      notes: input.noteKey
    }
  });

  if (existing) {
    return prisma.vehicleRequest.update({
      where: { id: existing.id },
      data: input.data
    });
  }

  return prisma.vehicleRequest.create({
    data: input.data
  });
}

async function upsertDemoOffer(input: {
  requestId: string;
  companyId: string;
  submittedByUserId: string;
  noteKey: string;
  data: Parameters<typeof prisma.vehicleOffer.create>[0]["data"];
}) {
  const existing = await prisma.vehicleOffer.findFirst({
    where: {
      requestId: input.requestId,
      companyId: input.companyId,
      notes: input.noteKey
    }
  });

  if (existing) {
    return prisma.vehicleOffer.update({
      where: { id: existing.id },
      data: input.data
    });
  }

  return prisma.vehicleOffer.create({
    data: input.data
  });
}

async function main() {
  const [admin, customer, companyUser1, companyUser2, companyUser3] = await Promise.all([
    upsertUser(demoAccounts.admin),
    upsertUser(demoAccounts.customer),
    upsertUser(demoAccounts.company1),
    upsertUser(demoAccounts.company2),
    upsertUser(demoAccounts.company3)
  ]);

  const [company1, company2, company3] = await Promise.all([
    upsertCompany({ publicName: "EV Import Armenia", type: CompanyType.IMPORTER, status: CompanyStatus.ACTIVE, user: companyUser1 }),
    upsertCompany({ publicName: "Green Auto Stock", type: CompanyType.STOCK_SELLER, status: CompanyStatus.ACTIVE, user: companyUser2 }),
    upsertCompany({ publicName: "Hybrid Motors", type: CompanyType.MIXED, status: CompanyStatus.PENDING, user: companyUser3 })
  ]);

  await seedVehicleCatalog();
  const bydAtto3 = await getCatalogVehicle("BYD", "Atto 3");
  await getCatalogVehicle("Tesla", "Model 3");
  await getCatalogVehicle("Nissan", "Leaf");

  const request1Note = "DEMO_REQUEST_ACTIVE_BYD_ATTO_3";
  const request2Note = "DEMO_REQUEST_SUBMITTED_RECOMMENDATION";
  const request1 = await upsertDemoRequest({
    customerId: customer.id,
    noteKey: request1Note,
    data: {
      customerId: customer.id,
      requestMode: VehicleRequestMode.EXACT_MODEL,
      status: VehicleRequestStatus.ACTIVE,
      fuelType: VehicleFuelType.ELECTRIC,
      makeId: bydAtto3.make.id,
      modelId: bydAtto3.model.id,
      budgetMin: 20_000,
      budgetMax: 30_000,
      stockImportPreference: StockImportPreference.BOTH,
      purchaseTimeline: PurchaseTimeline.ONE_TO_THREE_MONTHS,
      hasSolar: HasSolar.PLANNING,
      solarChargingInterest: SolarChargingInterest.YES,
      conditionPreference: VehicleConditionPreference.ANY,
      financingInterest: FinancingInterest.NOT_SURE,
      chargerNeeded: ChargerNeed.YES,
      customerRegion: "Yerevan",
      customerCity: "Yerevan",
      usageType: "Family and city driving",
      chargingAccess: "Home charging planned",
      notes: request1Note
    }
  });

  await upsertDemoRequest({
    customerId: customer.id,
    noteKey: request2Note,
    data: {
      customerId: customer.id,
      requestMode: VehicleRequestMode.RECOMMENDATION,
      status: VehicleRequestStatus.SUBMITTED,
      fuelType: VehicleFuelType.ELECTRIC,
      bodyType: VehicleBodyType.SUV_CROSSOVER,
      budgetMin: 15_000,
      budgetMax: 25_000,
      stockImportPreference: StockImportPreference.BOTH,
      purchaseTimeline: PurchaseTimeline.ONE_TO_THREE_MONTHS,
      hasSolar: HasSolar.UNKNOWN,
      solarChargingInterest: SolarChargingInterest.MAYBE_LATER,
      conditionPreference: VehicleConditionPreference.ANY,
      financingInterest: FinancingInterest.NOT_SURE,
      chargerNeeded: ChargerNeed.NOT_SURE,
      customerRegion: "Kotayk",
      customerCity: "Abovyan",
      usageType: "Daily commuting",
      notes: request2Note
    }
  });

  await upsertDemoOffer({
    requestId: request1.id,
    companyId: company1.id,
    submittedByUserId: companyUser1.id,
    noteKey: "DEMO_OFFER_COMPANY_1_IMPORT",
    data: {
      requestId: request1.id,
      companyId: company1.id,
      submittedByUserId: companyUser1.id,
      offerType: VehicleOfferType.IMPORT_ORDER,
      status: VehicleOfferStatus.SUBMITTED,
      makeId: bydAtto3.make.id,
      modelId: bydAtto3.model.id,
      year: 2025,
      fuelType: VehicleFuelType.ELECTRIC,
      availabilityStatus: VehicleAvailabilityStatus.IMPORT_REQUIRED,
      condition: VehicleCondition.NEW,
      estimatedDeliveryDaysMin: 30,
      estimatedDeliveryDaysMax: 45,
      priceAmount: 24_500,
      currency: OfferCurrency.USD,
      warrantyMonths: 12,
      chargerIncluded: false,
      financingAvailable: true,
      notes: "DEMO_OFFER_COMPANY_1_IMPORT"
    }
  });

  await upsertDemoOffer({
    requestId: request1.id,
    companyId: company2.id,
    submittedByUserId: companyUser2.id,
    noteKey: "DEMO_OFFER_COMPANY_2_STOCK",
    data: {
      requestId: request1.id,
      companyId: company2.id,
      submittedByUserId: companyUser2.id,
      offerType: VehicleOfferType.IN_STOCK,
      status: VehicleOfferStatus.SUBMITTED,
      makeId: bydAtto3.make.id,
      modelId: bydAtto3.model.id,
      year: 2024,
      fuelType: VehicleFuelType.ELECTRIC,
      availabilityStatus: VehicleAvailabilityStatus.IN_ARMENIA,
      condition: VehicleCondition.NEW,
      estimatedDeliveryDaysMin: 3,
      estimatedDeliveryDaysMax: 7,
      priceAmount: 27_500,
      currency: OfferCurrency.USD,
      warrantyMonths: 6,
      chargerIncluded: true,
      financingAvailable: false,
      notes: "DEMO_OFFER_COMPANY_2_STOCK"
    }
  });

  console.log("Demo data is ready.");
  console.log("Created/updated demo users: admin@evportal.local, customer@evportal.local, company1@evportal.local, company2@evportal.local, company3@evportal.local");
  console.log(`Companies: ${company1.publicName}, ${company2.publicName}, ${company3.publicName}`);
  console.log("Requests: active BYD Atto 3 request with two offers, submitted recommendation request.");
  console.log(`Platform admin user ID: ${admin.id}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
