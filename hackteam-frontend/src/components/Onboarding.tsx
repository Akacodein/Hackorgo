import { useState } from "react";
import type { CollegeOption, MyProfile } from "../types";
import { saveMyProfile } from "../lib/eventsApi";
import CollegePicker from "./CollegePicker";
import SkillsInput from "./SkillsInput";

type CollegeSelection = CollegeOption | { name: string; city: string } | null;

// One-time profile basics only. Which event(s) someone wants teammates
// for lives in EventFlow now, since that's something people repeat
// (add another event) rather than a once-ever step.
export default function Onboarding({
  me,
  onComplete,
}: {
  me: MyProfile;
  onComplete: (profile: MyProfile) => void;
}) {
  const [name, setName] = useState(me.name ?? "");
  const [college, setCollege] = useState<CollegeSelection>(
    me.collegeId && me.collegeName
      ? { id: me.collegeId, name: me.collegeName, city: me.city ?? "", state: me.state ?? "" }
      : null
  );
  const [skills, setSkills] = useState<string[]>(me.skills);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError("Add your name.");
    if (!college) return setError("Pick your college — or add it if it's not listed.");
    if (skills.length === 0) return setError("Pick at least one skill.");

    setSaving(true);
    try {
      const updated = await saveMyProfile({
        name: name.trim(),
        collegeId: "id" in college ? college.id : undefined,
        newCollege: "id" in college ? undefined : college,
        skills,
      });
      onComplete(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl mb-1">A few basics</h1>
        <p className="text-sm text-ink-soft mb-6">
          Just enough for people to know who they'd be teaming up with — no long bio needed.
        </p>

        <label className="block text-sm font-medium mb-1.5" htmlFor="ob-name">
          Your name
        </label>
        <input
          id="ob-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Aysha Khan"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-brand"
        />

        <label className="block text-sm font-medium mb-1.5">Your college</label>
        <div className="mb-5">
          <CollegePicker
            selected={college}
            onSelect={setCollege}
            onAddNew={setCollege}
            onClear={() => setCollege(null)}
          />
        </div>

        <div className="mb-6">
          <SkillsInput label="Your skills" value={skills} onChange={setSkills} />
        </div>

        {error && <p className="text-sm text-match mb-4">{error}</p>}

        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
