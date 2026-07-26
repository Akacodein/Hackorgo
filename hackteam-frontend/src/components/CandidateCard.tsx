import type { ScoredCandidate } from "../types";
import { TIER_LABEL } from "../lib/scoring";

const TIER_STYLES: Record<
  ScoredCandidate["tier"],
  { text: string; soft: string; dot: string }
> = {
  college: { text: "text-tier-college", soft: "bg-tier-college-soft", dot: "bg-tier-college" },
  city: { text: "text-tier-city", soft: "bg-tier-city-soft", dot: "bg-tier-city" },
  state: { text: "text-tier-far", soft: "bg-tier-far-soft", dot: "bg-tier-far" },
  far: { text: "text-tier-far", soft: "bg-tier-far-soft", dot: "bg-tier-far" },
};

function distanceLabel(km: number) {
  if (km < 1) return "< 1 km away";
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km).toLocaleString("en-IN")} km away`;
}

export default function CandidateCard({ candidate }: { candidate: ScoredCandidate }) {
  const tier = TIER_STYLES[candidate.tier];

  return (
    <div className="relative w-full h-full select-none rounded-3xl bg-surface border border-border shadow-[0_18px_40px_-16px_rgba(25,26,35,0.25)] overflow-hidden flex flex-col">
      {/* main panel */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-brand text-brand-ink flex items-center justify-center font-display text-lg">
            {candidate.avatarInitials}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl leading-tight truncate">{candidate.name}</h2>
            <p className="text-sm text-ink-soft truncate">{candidate.college}</p>
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-ink-soft">{candidate.bio}</p>

        <div className="flex flex-wrap gap-1.5">
          {(candidate.skills ?? [] ).map((s) => (
            <span
              key={s}
              className="font-mono-tag text-xs px-2 py-1 rounded-md bg-bg border border-border text-ink-soft"
            >
              {s}
            </span>
          ))}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft mb-1">Looking for</p>
          <div className="flex flex-wrap gap-1.5">
            {(candidate.lookingFor ?? []).map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-1 rounded-md bg-brand/10 text-brand font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* perforation */}
      <div className="relative h-0 border-t-2 border-dashed border-border">
        <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-bg" />
        <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-bg" />
      </div>

      {/* ticket stub: why you're seeing this */}
      <div className={`px-6 py-4 flex items-center justify-between ${tier.soft}`}>
        <span className={`flex items-center gap-2 font-medium text-sm ${tier.text}`}>
          <span className={`w-2 h-2 rounded-full ${tier.dot}`} />
          {TIER_LABEL[candidate.tier]}
        </span>
        <span className="font-mono-tag text-xs text-ink-soft">
          {distanceLabel(candidate.distanceKm)}
        </span>
      </div>
    </div>
  );
}
