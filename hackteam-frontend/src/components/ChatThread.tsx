import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import type { ChatMessage, MatchSummary } from "../types";
import { getMessages, sendMessage } from "../lib/eventsApi";

const POLL_MS = 3000;

export default function ChatThread({
  match,
  onBack,
}: {
  match: MatchSummary;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => getMessages(match.matchId).then((m) => !cancelled && setMessages(m));
    load();
    const t = window.setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [match.matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setSending(true);
    // Optimistic append so it feels instant instead of waiting on the round-trip.
    setMessages((prev) => [
      ...(prev ?? []),
      { id: `pending_${Date.now()}`, body: text, fromMe: true, createdAt: new Date().toISOString() },
    ]);
    try {
      await sendMessage(match.matchId, text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-bg flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-surface">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to messages"
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="w-9 h-9 rounded-full bg-brand text-brand-ink flex items-center justify-center font-display text-xs shrink-0">
          {match.otherUser.avatarInitials}
        </span>
        <div className="min-w-0">
          <p className="font-medium truncate">{match.otherUser.name}</p>
          <p className="text-xs text-ink-soft truncate">{match.eventName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-md w-full mx-auto px-4 py-4 flex flex-col gap-2">
        {messages?.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.fromMe
                ? "self-end bg-brand text-brand-ink rounded-br-md"
                : "self-start bg-surface border border-border rounded-bl-md"
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="max-w-md w-full mx-auto px-4 py-3 border-t border-border bg-surface flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Message…"
          className="flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="button"
          disabled={!draft.trim() || sending}
          onClick={send}
          aria-label="Send"
          className="w-10 h-10 rounded-full bg-brand text-brand-ink flex items-center justify-center disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
