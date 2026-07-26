import { useState } from "react";
import { Plus, X } from "lucide-react";

const PRESETS = [
  "React",
  "Node.js",
  "Python",
  "Machine Learning",
  "UI/UX Design",
  "Figma",
  "Backend",
  "DevOps",
  "Flutter",
  "Data Science",
  "Product",
  "Pitching",
];

export default function SkillsInput({
  label,
  value,
  onChange,
  placeholder = "Add your own",
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [custom, setCustom] = useState("");

  const toggle = (skill: string) => {
    onChange(value.includes(skill) ? value.filter((s) => s !== skill) : [...value, skill]);
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setCustom("");
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((skill) => {
          const active = value.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-brand text-brand-ink border-brand"
                  : "bg-surface text-ink-soft border-border hover:border-brand"
              }`}
            >
              {skill}
            </button>
          );
        })}
        {value
          .filter((s) => !PRESETS.includes(s))
          .map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className="text-sm pl-3 pr-2 py-1.5 rounded-full bg-brand text-brand-ink border border-brand inline-flex items-center gap-1"
            >
              {skill}
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
      </div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="button"
          onClick={addCustom}
          aria-label="Add"
          className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-ink-soft hover:border-brand shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
