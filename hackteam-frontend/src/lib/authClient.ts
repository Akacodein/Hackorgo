/**
 * Talks to the NextAuth (Auth.js) REST endpoints directly.
 *
 * We're NOT using `next-auth/react`'s signIn()/useSession() here: those
 * helpers assume the page is served BY the same Next.js app, and default
 * to relative URLs. This frontend is a separate Vite app, so once you
 * point VITE_API_BASE_URL at a real deployed backend, we call the same
 * NextAuth endpoints by hand, always with `credentials: "include"` so
 * the session cookie round-trips.
 *
 * For that to work in production, the frontend and the Next.js backend
 * need to sit on the SAME parent domain (e.g. app.yourdomain.com and
 * api.yourdomain.com), with the backend's auth cookie scoped to
 * `.yourdomain.com` (see auth.ts in the backend reference) and CORS on
 * the backend allowing the frontend's origin with credentials. Fully
 * cross-domain (different top-level domains) cookie auth is increasingly
 * unreliable because browsers restrict third-party cookies by default.
 *
 * DEMO_MODE: until VITE_API_BASE_URL is set, this file simulates the
 * flow in memory so `npm run dev` is clickable with zero backend. Wire
 * up the env var and the real fetch calls below take over automatically
 * — nothing else in the app needs to change.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const DEMO_MODE = !API_BASE;

let demoSession: Session | null = null;

async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Could not reach auth server for a CSRF token");
  const { csrfToken } = await res.json();
  return csrfToken;
}

export async function requestCode(email: string): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 500));
    console.info(`[demo mode] would email a 6-digit code to ${email} via Resend`);
    return;
  }
  const res = await fetch(`${API_BASE}/api/auth/send-code`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Couldn't send a code. Try again in a moment.");
  }
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 400));
    demoSession = { user: { id: "demo-user", name: email.split("@")[0], email } };
    return true;
  }
  const csrfToken = await getCsrfToken();
  await fetch(`${API_BASE}/api/auth/callback/credentials?json=true`, {
    method: "POST",
    redirect: "manual",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, code, csrfToken, json: "true" }),
  });
  const session = await getSession();
  return Boolean(session?.user);
}
  // NextAuth answers 200 with a redirect URL even on failed credentials —
  // the reliable check is whether a session now exists afterwards.
//   if (!res.ok) return false;
// const session = await getSession();
// return Boolean(session?.user);
// }

export interface Session {
  user?: { id: string; name: string; email: string };
  expires?: string;
}

export async function getSession(): Promise<Session | null> {
  if (DEMO_MODE) return demoSession;
  const res = await fetch(`${API_BASE}/api/auth/session`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data && Object.keys(data).length > 0 ? data : null;
}

export async function signOut(): Promise<void> {
  if (DEMO_MODE) {
    demoSession = null;
    return;
  }
  const csrfToken = await getCsrfToken();
  await fetch(`${API_BASE}/api/auth/signout`, {
    method: "POST",
    redirect: "manual",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, json: "true" }),
  });
  demoSession = null;
}

