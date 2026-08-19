import { prisma } from "./prisma";
import { hashCode, MAX_ATTEMPTS } from "./otp";
import { generateUniqueUsername } from "./username";

export type VerifyOtpResult =
  | { ok: true; user: Awaited<ReturnType<typeof upsertVerifiedUser>> }
  | { ok: false; reason: "no_code" | "too_many_attempts" | "wrong_code" };

async function upsertVerifiedUser(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  }
  const username = await generateUniqueUsername(email);
  return prisma.user.create({
    data: { email, emailVerified: new Date(), name: email.split("@")[0], username },
  });
}

export async function verifyOtpAndUpsertUser(email: string, code: string): Promise<VerifyOtpResult> {
  const record = await prisma.verificationCode.findFirst({
    where: { email, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  // No unexpired, unused code on file at all — either none was ever
  // requested, it already expired (10 min), or a previous correct entry
  // already consumed it.
  if (!record) return { ok: false, reason: "no_code" };

  // This exact code record has already had 5 wrong guesses against it —
  // it's dead now regardless of what's typed next, on purpose, so someone
  // can't just keep guessing. A fresh "Resend code" makes a brand new
  // record with its own attempt counter.
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  if (record.codeHash !== hashCode(code)) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "wrong_code" };
  }

  await prisma.verificationCode.update({ where: { id: record.id }, data: { consumed: true } });

  return { ok: true, user: await upsertVerifiedUser(email) };
}
