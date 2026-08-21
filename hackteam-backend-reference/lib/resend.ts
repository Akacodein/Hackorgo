import { Resend } from "resend";

// Constructed lazily inside the function (not at module load) so this
// file can be imported during `next build`/type-checking even before
// RESEND_API_KEY is set in the environment.
function client() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const { error } = await client().emails.send({
    from: process.env.RESEND_FROM ?? "Jabo <onboarding@resend.dev>",
    to: email,
    subject: `${code} is your Jabo verification code`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <p style="font-size: 14px; color: #5b5d6e;">Your Jabo verification code</p>
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

  if (error) {
    throw new Error(`Resend failed to send verification email: ${error.message}`);
  }
}
