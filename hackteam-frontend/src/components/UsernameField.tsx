import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { checkUsername } from "../lib/eventsApi";

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

export default function UsernameField({
  value,
  onChange,
  currentUsername,
}: {
  value: string;
  onChange: (v: string) => void;
  currentUsername?: string | null;
}) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!value || value === currentUsername) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    const t = window.setTimeout(async () => {
      try {
        const result = await checkUsername(value);
        setStatus(result.available ? "available" : result.reason === "format" ? "invalid" : "taken");
      } catch {
        setStatus("idle");
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [value, currentUsername]);

  const message: Record<Status, string | null> = {
    idle: null,
    checking: "Checking…",
    available: "Available",
    taken: "Already taken",
    invalid: "3-20 characters: letters, numbers, underscores only",
  };
  const color: Record<Status, string> = {
    idle: "text-ink-soft",
    checking: "text-ink-soft",
    available: "text-tier-college",
    taken: "text-match",
    invalid: "text-match",
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" htmlFor="username">
        Username
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft text-sm select-none">@</span>
        <input
          id="username"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          placeholder="ayshakhan"
          maxLength={20}
          className="w-full rounded-xl border border-border bg-surface pl-8 pr-9 py-3 outline-none focus:ring-2 focus:ring-brand"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {status === "checking" && <Loader2 className="w-4 h-4 text-ink-soft animate-spin" />}
          {status === "available" && <Check className="w-4 h-4 text-tier-college" />}
          {(status === "taken" || status === "invalid") && <X className="w-4 h-4 text-match" />}
        </span>
      </div>
      {message[status] && <p className={`text-xs mt-1.5 ${color[status]}`}>{message[status]}</p>}
    </div>
  );
}
