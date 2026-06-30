import {
  OfferCurrency,
  BatteryChemistry,
  ChargingPortType,
  SourceMarket,
  VehicleAvailabilityStatus,
  VehicleCondition,
  VehicleFuelType,
  VehicleOfferType
} from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { successResponse } from "../apiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  createCompanyOffer,
  getCompanyRequestContact,
  getCompanyVehicleRequest,
  listCompanyOffers,
  listCompanyOffersForRequest,
  listCompanyVehicleRequests,
  updateCompanyOffer,
  withdrawCompanyOffer
} from "../modules/vehicle-offers/service.js";

export const companyVehicleOffersRouter = Router();

const currentYear = new Date().getFullYear();

const offerSchemaObject = z.object({
    offerType: z.nativeEnum(VehicleOfferType),
    makeId: z.string().trim().optional().nullable(),
    modelId: z.string().trim().optional().nullable(),
    manualMake: z.string().trim().optional().nullable(),
    manualModel: z.string().trim().optional().nullable(),
    year: z.number().int().min(1990).max(currentYear + 2).optional().nullable(),
    trim: z.string().trim().max(120).optional().nullable(),
    fuelType: z.nativeEnum(VehicleFuelType),
    batteryCapacityKwh: z.number().positive().optional().nullable(),
    rangeKm: z.number().int().positive().optional().nullable(),
    mileageKm: z.number().int().nonnegative().optional().nullable(),
    color: z.string().trim().max(80).optional().nullable(),
    availabilityStatus: z.nativeEnum(VehicleAvailabilityStatus),
    condition: z.nativeEnum(VehicleCondition).optional(),
    sourceMarket: z.nativeEnum(SourceMarket).optional(),
    batteryChemistry: z.nativeEnum(BatteryChemistry).optional(),
    chargingPortType: z.nativeEnum(ChargingPortType).optional(),
    acChargingKw: z.number().positive().optional().nullable(),
    dcFastChargingKw: z.number().positive().optional().nullable(),
    driveType: z.string().trim().max(80).optional().nullable(),
    accidentHistoryDeclared: z.string().trim().max(240).optional().nullable(),
    vinAvailable: z.boolean().optional(),
    photosAvailable: z.boolean().optional(),
    documentsAvailable: z.boolean().optional(),
    inspectionIncluded: z.boolean().optional(),
    sourceCountry: z.string().trim().max(120).optional().nullable(),
    estimatedDeliveryDaysMin: z.number().int().positive().optional().nullable(),
    estimatedDeliveryDaysMax: z.number().int().positive().optional().nullable(),
    priceAmount: z.number().int().positive(),
    currency: z.nativeEnum(OfferCurrency),
    priceIncludesCustoms: z.boolean().optional(),
    priceIncludesRegistration: z.boolean().optional(),
    priceIncludesDeliveryToArmenia: z.boolean().optional(),
    priceIncludesDealerFee: z.boolean().optional(),
    priceIsFinal: z.boolean().optional(),
    advancePaymentRequired: z.boolean().optional(),
    advancePaymentAmount: z.number().int().positive().optional().nullable(),
    advancePaymentRefundable: z.boolean().optional().nullable(),
    warrantyMonths: z.number().int().nonnegative().optional().nullable(),
    batteryWarrantyMonths: z.number().int().nonnegative().optional().nullable(),
    warrantyProvider: z.string().trim().max(160).optional().nullable(),
    serviceSupportIncluded: z.boolean().optional(),
    chargerIncluded: z.boolean().optional(),
    financingAvailable: z.boolean().optional(),
    tradeInAccepted: z.boolean().optional(),
    offerValidUntil: z.string().datetime().optional().nullable(),
    notes: z.string().trim().max(3000).optional().nullable()
  });

const baseOfferSchema = offerSchemaObject
  .superRefine((input, context) => {
    if (
      input.estimatedDeliveryDaysMin &&
      input.estimatedDeliveryDaysMax &&
      input.estimatedDeliveryDaysMin > input.estimatedDeliveryDaysMax
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["estimatedDeliveryDaysMin"],
        message: "estimatedDeliveryDaysMin must not exceed estimatedDeliveryDaysMax"
      });
    }

    const hasCatalogVehicle = Boolean(input.makeId?.trim() || input.modelId?.trim());
    const hasManualVehicle = Boolean(input.manualMake?.trim() || input.manualModel?.trim());

    if (!hasCatalogVehicle && !hasManualVehicle) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["makeId"],
        message: "Offer requires either catalog make/model or manual make/model"
      });
    }

    if (hasCatalogVehicle && hasManualVehicle) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["makeId"],
        message: "Use either catalog make/model or manual make/model"
      });
    }

    if (hasCatalogVehicle && (!input.makeId?.trim() || !input.modelId?.trim())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["modelId"],
        message: "Both makeId and modelId are required"
      });
    }

    if (hasManualVehicle && (!input.manualMake?.trim() || !input.manualModel?.trim())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualModel"],
        message: "Both manualMake and manualModel are required"
      });
    }
  });

const updateOfferSchema = offerSchemaObject.partial().superRefine((input, context) => {
  if (
    input.estimatedDeliveryDaysMin &&
    input.estimatedDeliveryDaysMax &&
    input.estimatedDeliveryDaysMin > input.estimatedDeliveryDaysMax
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["estimatedDeliveryDaysMin"],
      message: "estimatedDeliveryDaysMin must not exceed estimatedDeliveryDaysMax"
    });
  }
});

companyVehicleOffersRouter.use(requireAuth);

companyVehicleOffersRouter.get("/vehicle-requests", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleRequests: await listCompanyVehicleRequests(request.user) }));
  } catch (error) {
    next(error);
  }
});

companyVehicleOffersRouter.get("/vehicle-requests/:requestId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleRequest: await getCompanyVehicleRequest(request.user, request.params.requestId) }));
  } catch (error) {
    next(error);
  }
});

companyVehicleOffersRouter.get("/vehicle-requests/:requestId/contact", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ contactReveal: await getCompanyRequestContact(request.user, request.params.requestId) }));
  } catch (error) {
    next(error);
  }
});

companyVehicleOffersRouter.get("/vehicle-requests/:requestId/offers", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleOffers: await listCompanyOffersForRequest(request.user, request.params.requestId) }));
  } catch (error) {
    next(error);
  }
});

companyVehicleOffersRouter.post("/vehicle-requests/:requestId/offers", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    const offer = await createCompanyOffer(request.user, request.params.requestId, baseOfferSchema.parse(request.body));
    response.status(201).json(successResponse({ vehicleOffer: offer }));
  } catch (error) {
    next(error);
  }
});

companyVehicleOffersRouter.get("/vehicle-offers", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleOffers: await listCompanyOffers(request.user) }));
  } catch (error) {
    next(error);
  }
});

companyVehicleOffersRouter.patch("/vehicle-offers/:offerId", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    const offer = await updateCompanyOffer(request.user, request.params.offerId, updateOfferSchema.parse(request.body));
    response.json(successResponse({ vehicleOffer: offer }));
  } catch (error) {
    next(error);
  }
});

companyVehicleOffersRouter.patch("/vehicle-offers/:offerId/withdraw", async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    }

    response.json(successResponse({ vehicleOffer: await withdrawCompanyOffer(request.user, request.params.offerId) }));
  } catch (error) {
    next(error);
  }
});
