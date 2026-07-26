import { MessageCircle, X } from "lucide-react";
import type { ScoredCandidate, EventInfo } from "../types";
import { TIER_LABEL } from "../lib/scoring";

export default function MatchModal({
  candidate,
  event,
  onClose,
}: {
  candidate: ScoredCandidate;
  event: EventInfo;
  onClose: () => void;
}) {
  const message = encodeURIComponent(
    `Hey ${candidate.name}! We both want to team up for ${event.name} — saw you're a ${TIER_LABEL[
      candidate.tier
    ].toLowerCase()} match on Crew. Want to team up?`
  );
  // In production this opens a real number once both sides share contact,
  // or falls back to an in-app thread — see note in App.tsx.
  const whatsappHref = `https://wa.me/?text=${message}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink/60 backdrop-blur-sm"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(155deg, var(--color-match), var(--color-match-2))" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-8 pt-12 pb-8 text-center text-white">
          <p className="font-mono-tag text-xs uppercase tracking-[0.2em] text-white/80 mb-2">
            Mutual interest
          </p>
          <h2 className="font-display text-3xl mb-1">It's a team-up!</h2>
          <p className="text-white/85 text-sm mb-6">
            You and {candidate.name} both swiped right for {event.name}.
          </p>

          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center font-display text-2xl mb-6">
            {candidate.avatarInitials}
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-white text-ink rounded-xl py-3 font-medium mb-3"
          >
            <MessageCircle className="w-4 h-4" />
            Message on WhatsApp
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-white/85 text-sm py-2"
          >
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
}
