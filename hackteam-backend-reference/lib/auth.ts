import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { verifyOtpAndUpsertUser } from "./verifyOtp";
import { generateUniqueUsername } from "./username";

// Render (like most non-Vercel hosts) sits behind a proxy Auth.js doesn't
// automatically recognise, so it refuses the request's Host header unless
// told to trust it. AUTH_TRUST_HOST=true (env var) does the same thing —
// keeping both isn't a conflict, just belt-and-suspenders.
const trustHost = true;

// The frontend (Vercel) and this backend (Render) are two entirely
// separate top-level domains right now — not subdomains of one parent —
// so there is no shared "site" for the browser to consider these cookies
// first-party. That means every Auth.js cookie has to be SameSite=None
// (+ Secure, which None requires) in production, or the browser silently
// drops them on the cross-site requests this architecture depends on.
// Once you're on a real domain with the frontend and backend as
// subdomains of it (app.yourdomain.com / api.yourdomain.com), switch
// this back to "lax" and set AUTH_COOKIE_DOMAIN — same-site cookies are
// more robust and aren't at risk from browsers phasing out third-party
// cookies, which this SameSite=None setup technically still is.
const isProd = process.env.NODE_ENV === "production";
const crossSiteCookie = {
  httpOnly: true,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  secure: isProd,
  path: "/",
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost,
  // Credentials provider requires JWT sessions — NextAuth doesn't support
  // database sessions for it, since there's no OAuth round-trip to persist.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  cookies: {
    sessionToken: { options: { ...crossSiteCookie, domain: process.env.AUTH_COOKIE_DOMAIN } },
    csrfToken: { options: crossSiteCookie },
    callbackUrl: { options: crossSiteCookie },
    state: { options: crossSiteCookie },
    nonce: { options: crossSiteCookie },
    pkceCodeVerifier: { options: crossSiteCookie },
  },

  providers: [
    // Google/GitHub need no clientId/clientSecret here — Auth.js reads
    // AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET and AUTH_GITHUB_ID/AUTH_GITHUB_SECRET
    // automatically. Nothing to configure beyond the .env values.
    Google({
        allowDangerousEmailAccountLinking: true,
    }),
    GitHub,
    Credentials({
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const code = credentials?.code as string | undefined;
        if (!email || !code) return null;

        const result = await verifyOtpAndUpsertUser(email, code);
        if (!result.ok) return null;

        return { id: result.user.id, email: result.user.email, name: result.user.name };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
    // Google/GitHub finish with a real browser redirect (unlike the
    // bearer-token credentials flow), and it has to land back on THIS
    // domain first so /auth/bridge can read the cookie session Auth.js
    // just set and convert it into the same bearer token the rest of the
    // app uses — see app/auth/bridge/page.tsx.
    async redirect({ baseUrl }) {
      return `${baseUrl}/auth/bridge`;
    },
  },

  // Google/GitHub sign-ups go through PrismaAdapter, not verifyOtp.ts —
  // so they never pick up a username the way an email/code signup does.
  // This assigns one right after the adapter creates the row, seeded
  // from their email so it's never left blank.
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const username = await generateUniqueUsername(user.email);
      await prisma.user.update({ where: { id: user.id }, data: { username } });
    },
  },
});
