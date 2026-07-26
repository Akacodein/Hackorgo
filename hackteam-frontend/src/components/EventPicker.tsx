import { useEffect, useState } from "react";
import { Search, Plus, Check, Link as LinkIcon } from "lucide-react";
import type { EventOption } from "../types";
import { searchEvents } from "../lib/eventsApi";

export default function EventPicker({
  selected,
  onSelect,
  onAddNew,
  onClear,
}: {
  selected: EventOption | null;
  onSelect: (event: EventOption) => void;
  onAddNew: (input: { name: string; organizer: string; link: string }) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EventOption[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [organizer, setOrganizer] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      searchEvents(query).then(setResults);
    }, 200);
    return () => window.clearTimeout(t);
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-tier-college bg-tier-college-soft px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Check className="w-4 h-4 text-tier-college shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{selected.name}</p>
            <p className="text-xs text-ink-soft truncate">
              {selected.organizer} · via {selected.platform}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClear} className="text-xs text-ink-soft underline shrink-0">
          Change
        </button>
      </div>
    );
  }

  const submitNew = () => {
    if (!query.trim()) return;
    try {
      // eslint-disable-next-line no-new
      new URL(link);
    } catch {
      setLinkError("Paste the full link, starting with https://");
      return;
    }
    setLinkError(null);
    onAddNew({ name: query.trim(), organizer: organizer.trim(), link: link.trim() });
  };

  return (
    <div>
      <div className="relative">
        <Search className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowAddNew(false);
          }}
          placeholder="Search events — e.g. Kshitij Hackathon"
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {query && (
        <div className="mt-2 rounded-xl border border-border bg-surface overflow-hidden">
          {results.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelect(e)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg border-b border-border last:border-0"
            >
              <span className="font-medium">{e.name}</span>
              <span className="text-ink-soft">
                {" "}
                · {e.organizer} · via {e.platform}
              </span>
            </button>
          ))}

          {!showAddNew ? (
            <button
              type="button"
              onClick={() => setShowAddNew(true)}
              className="w-full text-left px-4 py-2.5 text-sm text-brand flex items-center gap-2 hover:bg-bg"
            >
              <Plus className="w-3.5 h-3.5" />
              Can't find it — add "{query}"
            </button>
          ) : (
            <div className="p-3 flex flex-col gap-2 bg-bg">
              <input
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Who's organizing it? (optional)"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Paste the event link (Unstop, Hack2Skill...)"
                  className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              {linkError && <p className="text-xs text-match">{linkError}</p>}
              <button
                type="button"
                disabled={!link.trim()}
                onClick={submitNew}
                className="rounded-lg bg-brand text-brand-ink py-2 text-sm font-medium disabled:opacity-50"
              >
                Add event
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
