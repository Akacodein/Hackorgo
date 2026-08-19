import { useEffect, useRef, useState } from "react";
import { ChevronDown, User, Pencil, LogOut } from "lucide-react";
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

export default function HeaderProfileMenu({
  me,
  onViewProfile,
  onEditDetails,
  onSignOut,
}: {
  me: MyProfile | null;
  onViewProfile: () => void;
  onEditDetails: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full border border-border bg-surface pl-1 pr-2 py-1"
      >
        <span className="w-7 h-7 rounded-full bg-brand text-brand-ink flex items-center justify-center font-display text-xs">
          {initialsOf(me?.name ?? null)}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-soft transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-surface shadow-lg overflow-hidden z-30">
          <MenuItem
            Icon={User}
            label="View profile"
            onClick={() => {
              setOpen(false);
              onViewProfile();
            }}
          />

          <MenuItem
            Icon={Pencil}
            label="Edit details"
            onClick={() => {
              setOpen(false);
              onEditDetails();
            }}
          />

          <div className="border-t border-border" />

          <MenuItem
            Icon={LogOut}
            label="Sign out"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  Icon,
  label,
  onClick,
}: {
  Icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-bg"
    >
      <Icon className="w-4 h-4 text-ink-soft" />
      {label}
    </button>
  );
}

