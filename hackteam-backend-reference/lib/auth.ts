import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { verifyOtpAndUpsertUser } from "./verifyOtp";
import { generateUniqueUsername } from "./username";


const trustHost = true;

// const isProd = process.env.NODE_ENV === "production";
// const crossSiteCookie = {
//   httpOnly: true,
//   sameSite: (isProd ? "none" : "lax") as "none" | "lax",
//   secure: isProd,
//   path: "/",
// };

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost,
  // Credentials provider requires JWT sessions — NextAuth doesn't support
  // database sessions for it, since there's no OAuth round-trip to persist.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  // cookies: {
  //   sessionToken: { options: { ...crossSiteCookie, domain: process.env.AUTH_COOKIE_DOMAIN } },
  //   csrfToken: { options: crossSiteCookie },
  //   callbackUrl: { options: crossSiteCookie },
  //   state: { options: crossSiteCookie },
  //   nonce: { options: crossSiteCookie },
  //   pkceCodeVerifier: { options: crossSiteCookie },
  // },

  providers: [
    // Google/GitHub need no clientId/clientSecret here — Auth.js reads
    // AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET and AUTH_GITHUB_ID/AUTH_GITHUB_SECRET
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
    
    // async redirect({ baseUrl }) {
    //   return `${baseUrl}/auth/bridge`;
    // },
  },

  
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const username = await generateUniqueUsername(user.email);
      await prisma.user.update({ where: { id: user.id }, data: { username } });
    },
  },
});
