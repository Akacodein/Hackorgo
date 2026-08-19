import { NextRequest, NextResponse } from "next/server";
import { verifyOtpAndUpsertUser } from "@/lib/verifyOtp";
import { mintToken } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  console.log(`TOKEN HIT [${Math.random().toString(36).slice(2, 8)}] at`, new Date().toISOString());
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim();
  const code = (body?.code as string | undefined)?.trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  let result;
  try {
    result = await verifyOtpAndUpsertUser(email, code);
  } catch (err) {
    // Something broke that has nothing to do with whether the code was
    // right — e.g. the database being out of sync with the current
    // schema (exactly what happened here: a missing column). Say so
    // plainly instead of falling through to a "wrong code" message that
    // would send someone chasing the wrong problem, like it just did.
    console.error("Unexpected error while verifying a code:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end finishing sign-in. Try again in a moment." },
      { status: 500 }
    );
  }

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      no_code: "That code has expired or was never sent to this email. Tap resend.",
      too_many_attempts: "Too many wrong tries for that code. Tap resend to get a fresh one.",
      wrong_code: "That code didn't match. Check for a newer email, or resend.",
    };
    return NextResponse.json({ error: messages[result.reason] }, { status: 401 });
  }
  const { user } = result;

  const token = mintToken(user.id);
  return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}
