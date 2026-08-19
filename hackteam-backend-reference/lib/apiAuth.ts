import jwt from "jsonwebtoken";
import { auth } from "./auth";

const TOKEN_TTL = "30d";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set.");
  return s;
}

export function mintToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: TOKEN_TTL });
}

function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, secret()) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves the current user's id from either:
 *  1. An `Authorization: Bearer <token>` header — the primary mechanism,
 *     since it works identically in every browser regardless of
 *     cookie/SameSite policy. This is what the Vite frontend sends on
 *     every request once signed in.
 *  2. Auth.js's own cookie session, as a fallback — relevant right after
 *     an OAuth redirect lands back on THIS domain (see app/auth/bridge),
 *     and for same-origin/local development.
 */
export async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyToken(authHeader.slice(7));
  }
  const session = await auth();
  return session?.user?.id ?? null;
}
