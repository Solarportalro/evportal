import { Prisma } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler.js";
import { prisma } from "../../prisma.js";
import { toSlug } from "../../utils/slug.js";

type Actor = {
  id: string;
};

type MakeInput = {
  name: string;
};

type ModelInput = {
  name: string;
};

function normalizeName(name: string) {
  const normalized = name.trim();

  if (!normalized) {
    throw new AppError("Name is required", 400, "NAME_REQUIRED");
  }

  return normalized;
}

function mapUniqueError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError("Catalog item already exists", 409, "CATALOG_ITEM_EXISTS");
  }

  throw error;
}

async function logActivity(input: {
  actorUserId: string;
  action: string;
  entityType: "VehicleMake" | "VehicleModel";
  entityId: string;
  metadata?: Prisma.InputJsonObject;
}) {
  await prisma.activityLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata
    }
  });
}

export async function listAdminMakes() {
  return prisma.vehicleMake.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { models: true }
      }
    }
  });
}

export async function createMake(actor: Actor, input: MakeInput) {
  const name = normalizeName(input.name);
  const slug = toSlug(name);

  try {
    const make = await prisma.vehicleMake.create({
      data: { name, slug }
    });

    await logActivity({
      actorUserId: actor.id,
      action: "VEHICLE_MAKE_CREATED",
      entityType: "VehicleMake",
      entityId: make.id,
      metadata: { next: { name: make.name, slug: make.slug, isActive: make.isActive } }
    });

    return make;
  } catch (error) {
    mapUniqueError(error);
  }
}

export async function updateMake(actor: Actor, makeId: string, input: MakeInput) {
  const previous = await prisma.vehicleMake.findUnique({ where: { id: makeId } });

  if (!previous) {
    throw new AppError("Vehicle make not found", 404, "VEHICLE_MAKE_NOT_FOUND");
  }

  const name = normalizeName(input.name);
  const slug = toSlug(name);

  try {
    const make = await prisma.vehicleMake.update({
      where: { id: makeId },
      data: { name, slug }
    });

    await logActivity({
      actorUserId: actor.id,
      action: "VEHICLE_MAKE_UPDATED",
      entityType: "VehicleMake",
      entityId: make.id,
      metadata: {
        previous: { name: previous.name, slug: previous.slug, isActive: previous.isActive },
        next: { name: make.name, slug: make.slug, isActive: make.isActive }
      }
    });

    return make;
  } catch (error) {
    mapUniqueError(error);
  }
}

export async function setMakeActive(actor: Actor, makeId: string, isActive: boolean) {
  const previous = await prisma.vehicleMake.findUnique({ where: { id: makeId } });

  if (!previous) {
    throw new AppError("Vehicle make not found", 404, "VEHICLE_MAKE_NOT_FOUND");
  }

  const make = await prisma.vehicleMake.update({
    where: { id: makeId },
    data: { isActive }
  });

  await logActivity({
    actorUserId: actor.id,
    action: isActive ? "VEHICLE_MAKE_ACTIVATED" : "VEHICLE_MAKE_DEACTIVATED",
    entityType: "VehicleMake",
    entityId: make.id,
    metadata: {
      previous: { isActive: previous.isActive },
      next: { isActive: make.isActive }
    }
  });

  return make;
}

export async function listAdminModels(makeId: string) {
  const make = await prisma.vehicleMake.findUnique({
    where: { id: makeId }
  });

  if (!make) {
    throw new AppError("Vehicle make not found", 404, "VEHICLE_MAKE_NOT_FOUND");
  }

  return prisma.vehicleModel.findMany({
    where: { makeId },
    orderBy: { name: "asc" }
  });
}

export async function createModel(actor: Actor, makeId: string, input: ModelInput) {
  const make = await prisma.vehicleMake.findUnique({ where: { id: makeId } });

  if (!make) {
    throw new AppError("Vehicle make not found", 404, "VEHICLE_MAKE_NOT_FOUND");
  }

  const name = normalizeName(input.name);
  const slug = toSlug(name);

  try {
    const model = await prisma.vehicleModel.create({
      data: { makeId, name, slug }
    });

    await logActivity({
      actorUserId: actor.id,
      action: "VEHICLE_MODEL_CREATED",
      entityType: "VehicleModel",
      entityId: model.id,
      metadata: { next: { makeId, name: model.name, slug: model.slug, isActive: model.isActive } }
    });

    return model;
  } catch (error) {
    mapUniqueError(error);
  }
}

export async function updateModel(actor: Actor, modelId: string, input: ModelInput) {
  const previous = await prisma.vehicleModel.findUnique({ where: { id: modelId } });

  if (!previous) {
    throw new AppError("Vehicle model not found", 404, "VEHICLE_MODEL_NOT_FOUND");
  }

  const name = normalizeName(input.name);
  const slug = toSlug(name);

  try {
    const model = await prisma.vehicleModel.update({
      where: { id: modelId },
      data: { name, slug }
    });

    await logActivity({
      actorUserId: actor.id,
      action: "VEHICLE_MODEL_UPDATED",
      entityType: "VehicleModel",
      entityId: model.id,
      metadata: {
        previous: { makeId: previous.makeId, name: previous.name, slug: previous.slug, isActive: previous.isActive },
        next: { makeId: model.makeId, name: model.name, slug: model.slug, isActive: model.isActive }
      }
    });

    return model;
  } catch (error) {
    mapUniqueError(error);
  }
}

export async function setModelActive(actor: Actor, modelId: string, isActive: boolean) {
  const previous = await prisma.vehicleModel.findUnique({ where: { id: modelId } });

  if (!previous) {
    throw new AppError("Vehicle model not found", 404, "VEHICLE_MODEL_NOT_FOUND");
  }

  const model = await prisma.vehicleModel.update({
    where: { id: modelId },
    data: { isActive }
  });

  await logActivity({
    actorUserId: actor.id,
    action: isActive ? "VEHICLE_MODEL_ACTIVATED" : "VEHICLE_MODEL_DEACTIVATED",
    entityType: "VehicleModel",
    entityId: model.id,
    metadata: {
      previous: { isActive: previous.isActive },
      next: { isActive: model.isActive }
    }
  });

  return model;
}
