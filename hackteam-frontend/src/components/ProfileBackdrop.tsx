import type { MyProfile } from "../types";

function initialsOf(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfileBackdrop({ me }: { me: MyProfile }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <div className="absolute inset-0 bg-bg" />

      {/* Oversized, near-illegible initials — a personal watermark, not a
          readable card. Kept abstract on purpose so it reads as ambiance
          rather than a second, competing profile. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-semibold text-[46vw] leading-none text-ink/[0.035] blur-sm">
          {initialsOf(me.name)}
        </span>
      </div>

      <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-brand/15 blur-3xl" />
      <div className="absolute top-1/4 -right-32 w-[380px] h-[380px] rounded-full bg-tier-college/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-[320px] h-[320px] rounded-full bg-tier-city/10 blur-3xl" />

      {me.collegeName && (
        <p className="absolute bottom-8 inset-x-0 text-center font-mono-tag text-xs tracking-[0.2em] uppercase text-ink-soft/40">
          {me.name} · {me.collegeName}
        </p>
      )}
    </div>
  );
}
