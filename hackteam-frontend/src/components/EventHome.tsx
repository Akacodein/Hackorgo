import { useState } from "react";
import { Plus, Link as LinkIcon, Check, ArrowLeft } from "lucide-react";
import type { EventOption } from "../types";

export default function EventHome({
  events,
  onDone,
  onAddNew,
}: {
  events: Array<EventOption & { lookingFor: string[] }>;
  onDone: () => void;
  onAddNew: () => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyInvite = async (eventId: string) => {
    const link = `${window.location.origin}${window.location.pathname}?invite=${eventId}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("Copy this link:", link);
    }
    setCopiedId(eventId);
    window.setTimeout(() => setCopiedId((id) => (id === eventId ? null : id)), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1.5 text-sm text-ink-soft mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to swiping
        </button>

        <h1 className="font-display text-2xl mb-1">Your event listings</h1>
        <p className="text-sm text-ink-soft mb-6">
          People looking for these rank first in your feed. Share the link to bring in
          people who aren't on the app yet.
        </p>

        <div className="flex flex-col gap-2.5 mb-5">
          {events.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-surface px-4 py-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.name}</p>
                  <p className="text-xs text-ink-soft truncate">
                    {e.organizer} · via {e.platform}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyInvite(e.id)}
                  title="Copy a shareable invite link"
                  aria-label="Copy invite link"
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft hover:border-brand hover:text-brand transition-colors shrink-0"
                >
                  {copiedId === e.id ? (
                    <Check className="w-4 h-4 text-tier-college" />
                  ) : (
                    <LinkIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {e.lookingFor.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {e.lookingFor.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2 py-0.5 rounded-md bg-brand/10 text-brand font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="w-full rounded-xl border border-dashed border-border py-3 font-medium text-ink-soft flex items-center justify-center gap-2 hover:border-brand hover:text-brand transition-colors"
        >
          <Plus className="w-4 h-4" />
          Find teammates for another event
        </button>
      </div>
    </div>
  );
}
