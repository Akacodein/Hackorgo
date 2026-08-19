/**
 * Auth for a frontend (Vercel) and backend (Render) that don't share a
 * domain. Cross-site cookies are unreliable for this — Safari blocks
 * third-party cookies outright, Chrome is heading the same way — so the
 * primary mechanism here is a bearer token instead:
 *
 *  - Email code: POST /api/auth/token with {email, code} returns
 *    {token, user} directly, no cookie involved at all.
 *  - Google/GitHub: OAuth has to land back on the BACKEND's own domain
 *    first (cookies work there, same-origin). app/auth/bridge on the
 *    backend reads that cookie session, mints the same kind of token,
 *    and redirects to `${FRONTEND_URL}?token=...`. consumeTokenFromUrl()
 *    below picks that up.
 *
 * The token is stored in localStorage and sent as `Authorization: Bearer
 * <token>` on every request via authedFetch() — see lib/apiAuth.ts on
 * the backend for the matching side of this.
 *
 * Best short-term option if you don't have a domain yet: proxy /api
 * through the frontend's own Vercel domain (see vercel.json) and point
 * VITE_API_BASE_URL at an EMPTY string ("", not unset) so calls stay
 * same-origin. This bearer-token setup works either way, proxied or not.
 */

// unset (undefined)   -> demo mode, no backend
// "" (empty string)   -> same-origin, relative /api/... calls (via vercel.json proxy)
// "https://..."       -> a genuinely separate backend origin
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const DEMO_MODE = RAW_API_BASE === undefined;
const API_BASE = RAW_API_BASE ?? "";

const TOKEN_KEY = "crew.authToken";

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private browsing etc. — worst case, they sign in again next visit */
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

/** Pulls ?token=... off the URL after an OAuth redirect and stores it. */
export function consumeTokenFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) return false;
  setToken(token);
  params.delete("token");
  const rest = params.toString();
  window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : ""));
  return true;
}

/**
 * Every authenticated call in eventsApi.ts goes through this. Attaches
 * the bearer token when one exists, keeps `credentials:"include"` too
 * (harmless, and it's what makes the same-origin/proxied case and the
 * OAuth bridge moment work even before a token exists). On a 401, clears
 * whatever token we had — it's expired or invalid, no point resending it.
 */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
  if (res.status === 401) clearToken();
  return res;
}

async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Could not reach auth server for a CSRF token");
  const { csrfToken } = await res.json();
  return csrfToken;
}

export async function requestCode(email: string): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 500));
    console.info(`[demo mode] would email a 6-digit code to ${email}`);
    return;
  }
  const res = await fetch(`${API_BASE}/api/auth/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Couldn't send a code. Try again in a moment.");
  }
}

let demoSession: Session | null = null;

export type VerifyCodeResult = { ok: true } | { ok: false; message: string };

export async function verifyCode(email: string, code: string): Promise<VerifyCodeResult> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 400));
    demoSession = { user: { id: "demo-user", name: email.split("@")[0], email } };
    return { ok: true };
  }
  // Dedicated endpoint, not NextAuth's own /api/auth/callback/credentials
  // — that one answers with a redirect-shaped response on BOTH success
  // and failure (can't tell them apart from a custom client), and still
  // depends on a cookie round-trip. This one just returns {token} or a
  // clean 401, nothing else to misread.
  const res = await fetch(`${API_BASE}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, message: body.error ?? "That code didn't match. Check for a newer email, or resend." };
  }
  const { token } = await res.json();
  setToken(token);
  return { ok: true };
}

export type OAuthProvider = "google" | "github";

// OAuth needs a real page navigation (Google/GitHub's consent screens
// aren't something you fetch), so this can't be fetch-and-check like
// verifyCode. Auth.js still requires the sign-in POST to carry a CSRF
// token even for OAuth providers — `json=true` asks it to hand back the
// provider's authorization URL as JSON instead of a redirect, which we
// then navigate to ourselves. It comes back to app/auth/bridge on the
// backend, which hands the frontend a token the same way email/code does.

export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 500));
    demoSession = {
      user: {
        id: "demo-user",
        name: `Demo via ${provider}`,
        email: `demo@${provider}.example`,
      },
    };
    return;
  }

  const csrfToken = await getCsrfToken();

  const res = await fetch(`${API_BASE}/api/auth/signin/${provider}?json=true`, {
    method: "POST",
    credentials: "include",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ csrfToken, json: "true" }),
  });

  const location = res.headers.get("location");

  if (location) {
    window.location.href = location;
    return;
  }

  throw new Error(`Couldn't start ${provider} sign-in. Try again.`);
}

// export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
//   if (DEMO_MODE) {
//     await new Promise((r) => setTimeout(r, 500));
//     demoSession = { user: { id: "demo-user", name: `Demo via ${provider}`, email: `demo@${provider}.example` } };
//     return;
//   }
//   const csrfToken = await getCsrfToken();
//   const res = await fetch(`${API_BASE}/api/auth/signin/${provider}?json=true`, {
//     method: "POST",
//     credentials: "include",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({ csrfToken, json: "true" }),
//   });
//   const data = await res.json().catch(() => null);
//   if (data?.url) {
//     window.location.href = data.url;
//   } else {
//     throw new Error(`Couldn't start ${provider} sign-in. Try again.`);
//   }
// }

export interface Session {
  user?: { id: string; name: string; email: string };
  expires?: string;
}

/**
 * No dedicated "am I logged in" round trip for the token path — a stored
 * token is treated as optimistically valid, and the very next real call
 * (getMyProfile, right after this in App.tsx) is what actually proves it.
 * If that call 401s, authedFetch already cleared the token; App.tsx
 * catches the error and falls back to the sign-in screen.
 */
export async function getSession(): Promise<Session | null> {
  if (DEMO_MODE) return demoSession;
  if (getToken()) return { user: { id: "pending", name: "", email: "" } };
  return null;
}

export async function signOut(): Promise<void> {
  if (DEMO_MODE) {
    demoSession = null;
    return;
  }
  clearToken();
  // Best-effort cookie cleanup too, for the same-origin/OAuth-bridge
  // case — safe to ignore if it fails, the token is what actually matters.
  try {
    const csrfToken = await getCsrfToken();
    await fetch(`${API_BASE}/api/auth/signout`, {
      method: "POST",
      redirect: "manual",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, json: "true" }),
    });
  } catch {
    /* noop */
  }
}
