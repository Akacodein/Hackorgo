import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { requestCode, verifyCode, signInWithOAuth } from "../lib/authClient";
import { GoogleGlyph, GithubGlyph } from "./icons/SocialIcons";

const RESEND_COOLDOWN_SECONDS = 45;

export default function AuthPanel({ onVerified }: { onVerified: () => void }) {
  const [step, setStep] = useState<"start" | "code">("start");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  const startOAuth = async (provider: "google" | "github") => {
    setError(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider);
      // Real mode: signInWithOAuth already navigated the whole page away
      // to Google/GitHub, so nothing below this line meaningfully runs.
      // Demo mode: it just sets an in-memory session and returns.
      //onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setOauthLoading(null);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

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
      const result = await verifyCode(email, code);
      if (result.ok) onVerified();
      else setError(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-brand text-brand-ink flex items-center justify-center mb-5">
        <ShieldCheck className="w-5 h-5" />
      </div>

      {step === "start" ? (
        <>
          <h1 className="font-display text-2xl mb-1">Sign in to Crew</h1>
          <p className="text-sm text-ink-soft mb-6">Find teammates for the events you're going to.</p>

          <button
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => startOAuth("google")}
            className="w-full rounded-xl border border-border py-3 font-medium mb-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <GoogleGlyph className="w-4 h-4" />
            {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
          </button>
          <button
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => startOAuth("github")}
            className="w-full rounded-xl border border-border py-3 font-medium mb-5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <GithubGlyph className="w-4 h-4" />
            {oauthLoading === "github" ? "Redirecting…" : "Continue with GitHub"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-soft">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <input
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
            className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium disabled:opacity-50"
          >
            {loading ? "Sending…" : "Continue"}
          </button>
        </>
      ) : (
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
