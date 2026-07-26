import { createHash, randomInt } from "node:crypto";

export const CODE_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 45;
export const MAX_ATTEMPTS = 5;

export function generateCode(): string {
  // 6-digit numeric OTP. randomInt is CSPRNG-backed, unlike Math.random().
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
