import { Plus, ChevronRight } from "lucide-react";
import type { EventOption } from "../types";

export default function EventHome({
  events,
  onChoose,
  onAddNew,
}: {
  events: Array<EventOption & { lookingFor: string[] }>;
  onChoose: (event: EventOption) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl mb-1">Your events</h1>
        <p className="text-sm text-ink-soft mb-6">Pick one to see who's looking for a team.</p>

        <div className="flex flex-col gap-2.5 mb-5">
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onChoose(e)}
              className="w-full text-left rounded-xl border border-border bg-surface px-4 py-3.5 flex items-center justify-between hover:border-brand transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{e.name}</p>
                <p className="text-xs text-ink-soft truncate">
                  {e.organizer} · via {e.platform}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-soft shrink-0" />
            </button>
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
