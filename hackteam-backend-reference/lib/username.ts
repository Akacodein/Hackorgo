import { prisma } from "./prisma";

const VALID_USERNAME = /^[a-z0-9_]{3,20}$/;

export function isValidUsernameFormat(value: string): boolean {
  return VALID_USERNAME.test(value);
}

// Best-effort cleanup of a suggested value ("Aysha Khan" -> "ayshakhan",
// "aysha.khan@x.com" -> "ayshakhan") — not guaranteed valid on its own,
// generateUniqueUsername below pads it out if it's too short.
export function slugifyUsername(seed: string): string {
  const base = seed
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return base.length >= 3 ? base : `user${base}`;
}

export async function isUsernameTaken(username: string, excludingUserId?: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { username } });
  return Boolean(existing && existing.id !== excludingUserId);
}

// Used right after a brand-new account is created (OTP or OAuth) so
// nobody ever has a null username in practice, even before they've
// visited any profile screen themselves.
export async function generateUniqueUsername(seed: string): Promise<string> {
  const base = slugifyUsername(seed);
  let candidate = base;
  let suffix = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await isUsernameTaken(candidate)) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}
