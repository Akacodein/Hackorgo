import { useState } from "react";
import type { ReactNode } from "react";
import { X, Link2 } from "lucide-react";
import type { CollegeOption, MyProfile } from "../types";
import { saveMyProfile } from "../lib/eventsApi";
import { InstagramGlyph, TwitterGlyph, LinkedinGlyph, GithubGlyph } from "./icons/SocialIcons";
import CollegePicker from "./CollegePicker";
import SkillsInput from "./SkillsInput";
import UsernameField from "./UsernameField";

type CollegeSelection = CollegeOption | { name: string; city: string } | null;

export default function ProfileDetailsForm({
  me,
  onSaved,
  onClose,
}: {
  me: MyProfile;
  onSaved: (profile: MyProfile) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(me.name ?? "");
  const [username, setUsername] = useState(me.username ?? "");
  const [college, setCollege] = useState<CollegeSelection>(
    me.collegeId && me.collegeName
      ? { id: me.collegeId, name: me.collegeName, city: me.city ?? "", state: me.state ?? "" }
      : null
  );
  const [skills, setSkills] = useState<string[]>(me.skills);
  const [bio, setBio] = useState(me.bio ?? "");
  const [instagramUrl, setInstagramUrl] = useState(me.instagramUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(me.twitterUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(me.githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(me.linkedinUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(me.portfolioUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError("Add your name.");
    if (!college) return setError("Pick your college — or add it if it's not listed.");
    if (skills.length === 0) return setError("Pick at least one skill.");
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      return setError("Username must be 3-20 characters: lowercase letters, numbers, or underscores.");
    }

    setSaving(true);
    try {
      const updated = await saveMyProfile({
        name: name.trim(),
        username: username || undefined,
        collegeId: "id" in college ? college.id : undefined,
        newCollege: "id" in college ? undefined : college,
        skills,
        bio,
        instagramUrl,
        twitterUrl,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
      });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl">Edit profile</h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="block text-sm font-medium mb-1.5" htmlFor="edit-name">
          Your name
        </label>
        <input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-brand"
        />

        <div className="mb-5">
          <UsernameField value={username} onChange={setUsername} currentUsername={me.username} />
        </div>

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

        <div className="border-t border-border -mx-6 px-6 pt-6 mb-6">
          <p className="text-sm text-ink-soft mb-5">
            Everything below is optional — just helps teammates get a feel for you.
          </p>

          <label className="block text-sm font-medium mb-1.5" htmlFor="bio">
            Short bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="e.g. Frontend dev who likes clean UI and clutch demos."
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-brand resize-none"
          />

          <p className="text-sm font-medium mb-2">Socials</p>
          <div className="flex flex-col gap-2.5">
            <SocialInput Icon={InstagramGlyph} placeholder="Instagram profile link" value={instagramUrl} onChange={setInstagramUrl} />
            <SocialInput Icon={TwitterGlyph} placeholder="Twitter / X profile link" value={twitterUrl} onChange={setTwitterUrl} />
            <SocialInput Icon={GithubGlyph} placeholder="GitHub profile link" value={githubUrl} onChange={setGithubUrl} />
            <SocialInput Icon={LinkedinGlyph} placeholder="LinkedIn profile link" value={linkedinUrl} onChange={setLinkedinUrl} />
            <SocialInput Icon={Link2} placeholder="Portfolio / personal site link" value={portfolioUrl} onChange={setPortfolioUrl} />
          </div>
        </div>

        {error && <p className="text-sm text-match mb-4">{error}</p>}

        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="w-full rounded-xl bg-brand text-brand-ink py-3 font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function SocialInput({
  Icon,
  placeholder,
  value,
  onChange,
}: {
  Icon: (p: { className?: string }) => ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Icon className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
