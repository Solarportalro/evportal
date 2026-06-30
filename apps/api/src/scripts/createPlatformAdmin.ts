import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { normalizeEmail, normalizeArmenianPhone } from "../utils/identity.js";
import { hashPassword } from "../utils/security.js";

const inputSchema = z.object({
  ADMIN_EMAIL: z.string().trim().email(),
  ADMIN_PASSWORD: z.string().min(12),
  ADMIN_PHONE: z.string().trim().optional(),
  ADMIN_FULL_NAME: z.string().trim().optional()
});

function optionalText(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

async function main() {
  const input = inputSchema.parse(process.env);
  const normalizedEmail = normalizeEmail(input.ADMIN_EMAIL);
  const normalizedPhone = normalizeArmenianPhone(input.ADMIN_PHONE);
  const fullName = optionalText(input.ADMIN_FULL_NAME);

  if (!normalizedEmail) {
    throw new Error("ADMIN_EMAIL is required");
  }

  if (input.ADMIN_PHONE && !normalizedPhone) {
    throw new Error("ADMIN_PHONE must be a valid Armenian phone number when provided");
  }

  const passwordHash = await hashPassword(input.ADMIN_PASSWORD);
  if (normalizedPhone) {
    const userWithPhone = await prisma.user.findFirst({
      where: {
        normalizedPhone,
        OR: [{ normalizedEmail: null }, { normalizedEmail: { not: normalizedEmail } }]
      },
      select: { id: true }
    });

    if (userWithPhone) {
      throw new Error("ADMIN_PHONE already belongs to another user");
    }
  }

  const globalCustomer = await prisma.globalCustomer.findUnique({
    where: { normalizedEmail }
  });

  if (normalizedPhone) {
    const globalCustomerWithPhone = await prisma.globalCustomer.findFirst({
      where: {
        normalizedPhone,
        OR: [{ normalizedEmail: null }, { normalizedEmail: { not: normalizedEmail } }]
      },
      select: { id: true }
    });

    if (globalCustomerWithPhone) {
      throw new Error("ADMIN_PHONE already belongs to another global customer");
    }
  }

  const resolvedGlobalCustomer = globalCustomer
    ? await prisma.globalCustomer.update({
        where: { id: globalCustomer.id },
        data: {
          normalizedEmail: globalCustomer.normalizedEmail ?? normalizedEmail,
          normalizedPhone: globalCustomer.normalizedPhone ?? normalizedPhone,
          fullName: globalCustomer.fullName ?? fullName
        }
      })
    : await prisma.globalCustomer.create({
        data: {
          normalizedEmail,
          normalizedPhone,
          fullName
        }
      });

  const existingUser = await prisma.user.findFirst({
    where: { normalizedEmail }
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          globalCustomerId: resolvedGlobalCustomer.id,
          email: normalizedEmail,
          phone: existingUser.phone ?? optionalText(input.ADMIN_PHONE),
          normalizedEmail,
          normalizedPhone: existingUser.normalizedPhone ?? normalizedPhone,
          passwordHash,
          role: UserRole.PLATFORM_ADMIN,
          isActive: true,
          disabledAt: null,
          disabledReason: null
        },
        select: { id: true, email: true, role: true, isActive: true }
      })
    : await prisma.user.create({
        data: {
          globalCustomerId: resolvedGlobalCustomer.id,
          email: input.ADMIN_EMAIL.trim().toLowerCase(),
          phone: optionalText(input.ADMIN_PHONE),
          normalizedEmail,
          normalizedPhone,
          passwordHash,
          role: UserRole.PLATFORM_ADMIN,
          preferredLanguage: "hy",
          isActive: true
        },
        select: { id: true, email: true, role: true, isActive: true }
      });

  console.log("Platform admin is ready.");
  console.log(`User ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Active: ${user.isActive}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Failed to create platform admin");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
