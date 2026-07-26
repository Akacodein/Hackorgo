import { useEffect, useState } from "react";
import { Mail, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import { requestCode, verifyCode } from "../lib/authClient";
import type { AuthMode } from "../types";

const RESEND_COOLDOWN_SECONDS = 45;

export default function AuthPanel({ onVerified }: { onVerified: () => void }) {
  const [step, setStep] = useState<"choice" | "email" | "code">("choice");
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const chooseMode = (next: AuthMode) => {
    setMode(next);
    setStep("email");
  };

  const sendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      await requestCode(email);
      setStep("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const ok = await verifyCode(email, code);
      if (ok) onVerified();
      else setError("That code didn't match. Check for a newer email, or resend.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-brand text-brand-ink flex items-center justify-center mb-5">
        {step === "choice" && <ShieldCheck className="w-5 h-5" />}
        {step === "email" && <Mail className="w-5 h-5" />}
        {step === "code" && <ShieldCheck className="w-5 h-5" />}
      </div>

      {step === "choice" && (
        <>
          <h1 className="font-display text-2xl mb-1">Welcome to Crew</h1>
          <p className="text-sm text-ink-soft mb-6">
            Find teammates for the events you're already going to — no password, ever.
          </p>
          <button
            type="button"
            onClick={() => chooseMode("signup")}
            className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium mb-3 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            I'm new here
          </button>
          <button
            type="button"
            onClick={() => chooseMode("signin")}
            className="w-full rounded-xl border border-border py-3 font-medium flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            I already have an account
          </button>
        </>
      )}

      {step === "email" && (
        <>
          <h1 className="font-display text-2xl mb-1">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-ink-soft mb-6">
            We'll email you a 6-digit code — no password to remember.
          </p>
          <label className="block text-sm font-medium mb-1.5" htmlFor="email">
            College or personal email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-brand"
          />
          {error && <p className="text-sm text-match mb-4">{error}</p>}
          <button
            type="button"
            disabled={!email || loading}
            onClick={sendCode}
            className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium disabled:opacity-50 mb-3"
          >
            {loading ? "Sending…" : "Send code"}
          </button>
          <button type="button" onClick={() => setStep("choice")} className="w-full text-sm text-ink-soft py-1">
            Back
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <h1 className="font-display text-2xl mb-1">Check your inbox</h1>
          <p className="text-sm text-ink-soft mb-6">
            Enter the 6-digit code we sent to <span className="font-medium">{email}</span>.
          </p>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="w-full text-center tracking-[0.5em] font-mono-tag text-xl rounded-xl border border-border bg-surface px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-brand"
          />
          {error && <p className="text-sm text-match mb-4">{error}</p>}
          <button
            type="button"
            disabled={code.length !== 6 || loading}
            onClick={submitCode}
            className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium disabled:opacity-50 mb-3"
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            disabled={cooldown > 0 || loading}
            onClick={sendCode}
            className="w-full text-sm text-ink-soft py-2 disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </>
      )}
    </div>
  );
}
