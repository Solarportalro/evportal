import { prisma } from "../../prisma.js";
import { normalizeIdentityInput, type IdentityInput } from "../../utils/identity.js";

export { normalizeIdentityInput };

export async function findOrCreateGlobalCustomer(input: IdentityInput) {
  const normalized = normalizeIdentityInput(input);

  if (!normalized.normalizedEmail && !normalized.normalizedPhone) {
    return null;
  }

  const existing = normalized.normalizedPhone
    ? await prisma.globalCustomer.findUnique({
        where: { normalizedPhone: normalized.normalizedPhone }
      })
    : null;

  const globalCustomer =
    existing ??
    (normalized.normalizedEmail
      ? await prisma.globalCustomer.findUnique({
          where: { normalizedEmail: normalized.normalizedEmail }
        })
      : null);

  if (globalCustomer) {
    if (
      (!globalCustomer.normalizedPhone && normalized.normalizedPhone) ||
      (!globalCustomer.normalizedEmail && normalized.normalizedEmail) ||
      (!globalCustomer.fullName && normalized.fullName)
    ) {
      return prisma.globalCustomer.update({
        where: { id: globalCustomer.id },
        data: {
          normalizedPhone: globalCustomer.normalizedPhone ?? normalized.normalizedPhone,
          normalizedEmail: globalCustomer.normalizedEmail ?? normalized.normalizedEmail,
          fullName: globalCustomer.fullName ?? normalized.fullName
        }
      });
    }

    return globalCustomer;
  }

  return prisma.globalCustomer.create({
    data: {
      normalizedPhone: normalized.normalizedPhone,
      normalizedEmail: normalized.normalizedEmail,
      fullName: normalized.fullName
    }
  });
}

export async function linkUserToGlobalCustomer(userId: string, globalCustomerId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { globalCustomerId }
  });
}
