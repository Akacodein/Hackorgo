import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/resend";
import { CODE_TTL_MINUTES, RESEND_COOLDOWN_SECONDS, generateCode, hashCode } from "@/lib/otp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const recent = await prisma.verificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.lastSentAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    const waitSec = Math.ceil(
      (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recent.lastSentAt.getTime())) / 1000
    );
    return NextResponse.json(
      { error: `Wait ${waitSec}s before requesting another code.` },
      { status: 429 }
    );
  }

  const code = generateCode();

  await prisma.verificationCode.create({
    data: {
      email,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  await sendVerificationCodeEmail(email, code);

  return NextResponse.json({ ok: true });
}
