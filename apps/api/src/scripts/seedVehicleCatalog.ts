import { toSlug } from "../utils/slug.js";

process.env.DATABASE_URL ??= "postgresql://evportal:evportal_dev_password@localhost:5432/evportal_dev?schema=public";

async function main() {
  const [{ prisma }, { vehicleCatalogSeed }] = await Promise.all([
    import("../prisma.js"),
    import("../modules/vehicle-catalog/data.js")
  ]);
  let makeCount = 0;
  let modelCount = 0;

  for (const item of vehicleCatalogSeed) {
    const make = await prisma.vehicleMake.upsert({
      where: { slug: toSlug(item.make) },
      update: {
        name: item.make,
        isActive: true
      },
      create: {
        name: item.make,
        slug: toSlug(item.make),
        isActive: true
      }
    });
    makeCount += 1;

    for (const modelName of item.models) {
      await prisma.vehicleModel.upsert({
        where: {
          makeId_slug: {
            makeId: make.id,
            slug: toSlug(modelName)
          }
        },
        update: {
          name: modelName,
          isActive: true
        },
        create: {
          makeId: make.id,
          name: modelName,
          slug: toSlug(modelName),
          isActive: true
        }
      });
      modelCount += 1;
    }
  }

  console.log(`Seeded ${makeCount} vehicle makes and ${modelCount} vehicle models.`);
  await prisma.$disconnect();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
