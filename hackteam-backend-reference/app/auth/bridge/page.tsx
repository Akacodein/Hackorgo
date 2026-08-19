import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { mintToken } from "@/lib/apiAuth";

// Google/GitHub finish with a real browser redirect that lands back on
// THIS backend (same-origin, so Auth.js's cookie is readable here even
// though the frontend on Vercel could never read it directly). This page
// exists purely to mint a bearer token from that cookie session and hand
// it to the frontend — after this, Google/GitHub sign-ins work exactly
// like the email/code sign-in, over the same bearer token.
export default async function AuthBridgePage() {
  const frontendUrl = process.env.FRONTEND_URL || "/";
  const session = await auth();

  if (!session?.user?.id) {
    redirect(frontendUrl);
  }

  const token = mintToken(session.user.id);
  redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
}
