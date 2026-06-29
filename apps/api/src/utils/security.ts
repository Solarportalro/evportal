import bcrypt from "bcrypt";
import crypto from "node:crypto";

const PASSWORD_SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function addDuration(date: Date, duration: string): Date {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (!match) {
    throw new Error(`Unsupported duration: ${duration}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000
  };

  return new Date(date.getTime() + amount * multipliers[unit]);
}
