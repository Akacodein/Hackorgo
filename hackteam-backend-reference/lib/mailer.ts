import nodemailer from "nodemailer";

/**
 * Short-term alternative to lib/resend.ts. Resend (and every other
 * transactional email provider — SendGrid, Postmark, SES...) restricts
 * unverified senders to only emailing their own account address, which
 * is exactly the "did I break Resend" symptom of only your own inbox
 * getting codes. That's not a bug, it's anti-spam policy, and it won't
 * lift until you verify a domain you own.
 *
 * Gmail SMTP has no such restriction — a normal Gmail account can email
 * anyone, no domain required, ~500 emails/day free, which is plenty
 * for testing and an early user base. Once you have a domain, switch
 * app/api/auth/send-code/route.ts's import back to "@/lib/resend" and
 * this file becomes dead code you can delete.
 *
 * Setup:
 *  1. Make a dedicated Gmail account for the app (don't use your personal one).
 *  2. Turn on 2-Step Verification on it (myaccount.google.com/security).
 *  3. Create an "App Password" there (search "App passwords") — a 16-character
 *     code, NOT your real Gmail password.
 *  4. Set GMAIL_USER and GMAIL_APP_PASSWORD in Render's env vars.
 */

function transporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  await transporter().sendMail({
    from: `Crew <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `${code} is your Crew verification code`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <p style="font-size: 14px; color: #5b5d6e;">Your Crew verification code</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 8px 0 16px;">
          ${code}
        </p>
        <p style="font-size: 13px; color: #5b5d6e;">
          Expires in ${process.env.NEXT_PUBLIC_CODE_TTL_MINUTES ?? "10"} minutes.
          Didn't request this? You can ignore this email.
        </p>
      </div>
    `,
  });
}
