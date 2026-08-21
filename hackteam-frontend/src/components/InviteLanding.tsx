import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { EventOption } from "../types";
import { getPublicEvent } from "../lib/eventsApi";

export default function InviteLanding({
  eventId,
  onContinue,
}: {
  eventId: string;
  onContinue: () => void;
}) {
  const [event, setEvent] = useState<EventOption | null | undefined>(undefined);

  useEffect(() => {
    getPublicEvent(eventId).then(setEvent);
  }, [eventId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand text-brand-ink flex items-center justify-center mx-auto mb-5">
          <Users className="w-6 h-6" />
        </div>

        {event === undefined && <p className="text-sm text-ink-soft">Loading invite…</p>}

        {event === null && (
          <>
            <h1 className="font-display text-2xl mb-2">That link isn't valid anymore</h1>
            <p className="text-sm text-ink-soft mb-6">You can still join and find teammates for other events.</p>
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium"
            >
              Continue to Jabo
            </button>
          </>
        )}

        {event && (
          <>
            <p className="text-sm text-ink-soft mb-1">You're invited to find teammates for</p>
            <h1 className="font-display text-2xl mb-1">{event.name}</h1>
            <p className="text-sm text-ink-soft mb-8">
              {event.organizer} · via {event.platform}
            </p>
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium mb-3"
            >
              Join & find teammates
            </button>
            <p className="text-xs text-ink-soft">No password — just your email, takes under a minute.</p>
          </>
        )}
      </div>
    </div>
  );
}
