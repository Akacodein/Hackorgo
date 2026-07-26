import { useEffect, useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import type { CollegeOption } from "../types";
import { searchColleges } from "../lib/eventsApi";

type Selected = CollegeOption | { name: string; city: string } | null;

export default function CollegePicker({
  selected,
  onSelect,
  onAddNew,
  onClear,
}: {
  selected: Selected;
  onSelect: (college: CollegeOption) => void;
  onAddNew: (input: { name: string; city: string }) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CollegeOption[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCity, setNewCity] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      searchColleges(query).then(setResults);
    }, 200);
    return () => window.clearTimeout(t);
  }, [query]);

  if (selected) {
    const isNew = !("id" in selected);
    return (
      <div className="flex items-center justify-between rounded-xl border border-tier-college bg-tier-college-soft px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Check className="w-4 h-4 text-tier-college shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{selected.name}</p>
            {isNew && <p className="text-xs text-ink-soft">Adding as a new college · {selected.city}</p>}
          </div>
        </div>
        <button type="button" onClick={onClear} className="text-xs text-ink-soft underline shrink-0">
          Change
        </button>
      </div>
    );
  }

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
          placeholder="Search your college..."
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {query && (
        <div className="mt-2 rounded-xl border border-border bg-surface overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg border-b border-border last:border-0"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-ink-soft"> · {c.city}, {c.state}</span>
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
            <div className="p-3 flex gap-2 bg-bg">
              <input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Which city is it in?"
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                disabled={!newCity.trim()}
                onClick={() => onAddNew({ name: query.trim(), city: newCity.trim() })}
                className="rounded-lg bg-brand text-brand-ink px-3 text-sm font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
