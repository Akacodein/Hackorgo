import { useEffect, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import type { MatchSummary } from "../types";
import { getMyMatches } from "../lib/eventsApi";

export default function ChatInbox({
  onOpenThread,
  onClose,
}: {
  onOpenThread: (match: MatchSummary) => void;
  onClose: () => void;
}) {
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);

  useEffect(() => {
    getMyMatches().then(setMatches);
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface">
        <h1 className="font-display text-xl">Messages</h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-w-md w-full mx-auto px-4 py-4">
        {matches === null && <p className="text-sm text-ink-soft px-2">Loading…</p>}

        {matches?.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 mt-16 px-6">
            <div className="w-14 h-14 rounded-2xl bg-tier-college-soft flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-tier-college" />
            </div>
            <h3 className="font-display text-lg">No conversations yet</h3>
            <p className="text-sm text-ink-soft">
              Once you and someone else both swipe right, you'll be able to message here.
            </p>
          </div>
        )}

        {matches?.map((m) => (
          <button
            key={m.matchId}
            type="button"
            onClick={() => onOpenThread(m)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface text-left"
          >
            <span className="w-11 h-11 rounded-full bg-brand text-brand-ink flex items-center justify-center font-display text-sm shrink-0">
              {m.otherUser.avatarInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium truncate">{m.otherUser.name}</span>
              </span>
              <span className="block text-xs text-ink-soft truncate">
                {m.lastMessage ? (m.lastMessage.fromMe ? "You: " : "") + m.lastMessage.body : `Matched for ${m.eventName}`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
