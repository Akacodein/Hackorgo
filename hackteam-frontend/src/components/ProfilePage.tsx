import { Pencil, ArrowLeft, Link2 } from "lucide-react";
import type { ReactNode } from "react";
import type { MyProfile } from "../types";
import { InstagramGlyph, TwitterGlyph, LinkedinGlyph, GithubGlyph } from "./icons/SocialIcons";

function initialsOf(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const SOCIALS: Array<{ key: keyof MyProfile; Icon: (p: { className?: string }) => ReactNode; label: string }> = [
  { key: "instagramUrl", Icon: InstagramGlyph, label: "Instagram" },
  { key: "twitterUrl", Icon: TwitterGlyph, label: "Twitter" },
  { key: "githubUrl", Icon: GithubGlyph, label: "GitHub" },
  { key: "linkedinUrl", Icon: LinkedinGlyph, label: "LinkedIn" },
  { key: "portfolioUrl", Icon: Link2, label: "Portfolio" },
];

export default function ProfilePage({
  me,
  onEdit,
  onBack,
}: {
  me: MyProfile;
  onEdit: () => void;
  onBack: () => void;
}) {
  const activeSocials = SOCIALS.filter((s) => Boolean(me[s.key]));

  return (
    // <div className="min-h-screen bg-bg px-4 py-8 flex justify-center">
    <div className="fixed inset-0 z-[60] bg-bg overflow-y-auto px-4 py-8 flex justify-center">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-ink-soft mb-4 hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="rounded-3xl bg-surface border border-border shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="w-24 h-24 rounded-2xl bg-brand text-brand-ink flex items-center justify-center font-display text-3xl mb-4">
              {initialsOf(me.name)}
            </div>

            <h1 className="font-display text-2xl">{me.name ?? "Add your name"}</h1>
            <p className="font-mono-tag text-sm text-ink-soft mb-2">@{me.username ?? "…"}</p>

            {(me.collegeName || me.city) && (
              <p className="text-sm text-ink-soft mb-3">
                {me.collegeName}
                {me.collegeName && me.city ? " · " : ""}
                {me.city}
                {me.state ? `, ${me.state}` : ""}
              </p>
            )}

            {me.bio && <p className="text-[15px] leading-relaxed text-ink mb-4">{me.bio}</p>}

            {activeSocials.length > 0 && (
              <div className="flex items-center gap-2 mb-5">
                {activeSocials.map(({ key, Icon, label }) => (
                  <a
                    key={key}
                    href={me[key] as string}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft hover:border-brand hover:text-brand transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onEdit}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:border-brand hover:text-brand transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit profile details
            </button>
          </div>

          {me.skills.length > 0 && (
            <div className="px-6 py-5 border-t border-border bg-bg/60">
              <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {me.skills.map((s) => (
                  <span
                    key={s}
                    className="font-mono-tag text-xs px-2 py-1 rounded-md bg-surface border border-border text-ink-soft"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
