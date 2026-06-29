import { prisma } from "../../prisma.js";

export async function listActiveMakes() {
  return prisma.vehicleMake.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });
}

export async function listActiveModels(makeId: string) {
  return prisma.vehicleModel.findMany({
    where: {
      makeId,
      isActive: true,
      make: { isActive: true }
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      makeId: true,
      name: true,
      slug: true
    }
  });
}
