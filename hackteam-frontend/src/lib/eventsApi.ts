import type {
  CollegeOption,
  CurrentUser,
  EventOption,
  MyProfile,
  ScoredCandidate,
  SwipeDirection,
} from "../types";
import { MOCK_CANDIDATES, ME, CURRENT_EVENT } from "../data/mockCandidates";
import { scoreCandidates } from "./scoring";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

// People who (in this demo) already swiped right on you, so you can see
// the match modal fire. In production this is just whatever the
// candidates/swipe route in hackteam-backend-reference returns.
const DEMO_ALREADY_INTERESTED = new Set(["c1", "c4"]);

const DEMO_COLLEGES: CollegeOption[] = [
  { id: "col_iitkgp", name: "IIT Kharagpur", city: "Kharagpur", state: "West Bengal" },
  { id: "col_kce", name: "Kharagpur College of Engineering", city: "Kharagpur", state: "West Bengal" },
  { id: "col_ju", name: "Jadavpur University", city: "Kolkata", state: "West Bengal" },
  { id: "col_dtu", name: "Delhi Technological University", city: "Delhi", state: "Delhi" },
];

// Seed the picker with the one event the mock candidates belong to, so
// demo mode has something to find/select right away.
const DEMO_EVENTS: EventOption[] = [
  { id: CURRENT_EVENT.id, name: CURRENT_EVENT.name, organizer: CURRENT_EVENT.organizer, platform: CURRENT_EVENT.platform },
];

// Demo-mode profile, in memory only — starts incomplete on purpose, so
// the onboarding step is easy to see without a backend attached. Once
// you complete it, it's remembered for the rest of this page session.
let demoProfile: MyProfile = {
  id: "demo-user",
  name: null,
  email: "you@example.edu",
  city: null,
  state: null,
  skills: [],
  collegeId: null,
  collegeName: null,
  profileComplete: false,
};

// Events the demo user has said they're looking for teammates for,
// keyed by event id — starts empty so the "add your first event" flow
// is easy to see too.
const demoMyEvents = new Map<string, { event: EventOption; lookingFor: string[] }>();

function guessPlatform(link: string): string {
  try {
    const hostname = new URL(link).hostname.replace(/^www\./, "");
    const known: Record<string, string> = {
      "unstop.com": "Unstop",
      "hack2skill.com": "Hack2Skill",
      "hackquest.io": "HackQuest",
      "devfolio.co": "Devfolio",
      "devpost.com": "Devpost",
      "mlh.io": "MLH",
    };
    if (known[hostname]) return known[hostname];
    return hostname.split(".")[0].replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Other";
  }
}

export async function fetchCandidates(eventId: string): Promise<ScoredCandidate[]> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 400));
    // Score against whatever was entered during onboarding, not the
    // hardcoded mock persona — otherwise the tiers on screen wouldn't
    // match the profile you just filled in. Demo mode always shows the
    // same practice cast regardless of which event id is passed in.
    const me: CurrentUser = {
      ...ME,
      name: demoProfile.name ?? ME.name,
      college: demoProfile.collegeName ?? ME.college,
      city: demoProfile.city ?? ME.city,
      state: demoProfile.state ?? ME.state,
    };
    return scoreCandidates(MOCK_CANDIDATES, me);
  }
  const res = await fetch(`${API_BASE}/api/events/${eventId}/candidates`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Couldn't load people for this event.");
  return res.json();
}

export async function recordSwipe(
  eventId: string,
  candidateId: string,
  direction: SwipeDirection
): Promise<{ matched: boolean }> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 150));
    return { matched: direction === "right" && DEMO_ALREADY_INTERESTED.has(candidateId) };
  }
  const res = await fetch(`${API_BASE}/api/events/${eventId}/swipe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId, direction }),
  });
  if (!res.ok) throw new Error("Couldn't record that swipe.");
  return res.json();
}

export function getCurrentUser(): CurrentUser {
  return ME;
}

export async function getMyProfile(): Promise<MyProfile> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 300));
    return demoProfile;
  }
  const res = await fetch(`${API_BASE}/api/me`, { credentials: "include" });
  if (!res.ok) throw new Error("Couldn't load your profile.");
  return res.json();
}

export async function saveMyProfile(input: {
  name: string;
  collegeId?: string;
  newCollege?: { name: string; city: string };
  skills: string[];
}): Promise<MyProfile> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 400));
    let collegeId = input.collegeId;
    let college = DEMO_COLLEGES.find((c) => c.id === collegeId);

    if (!collegeId && input.newCollege) {
      college = { id: `col_${Date.now()}`, name: input.newCollege.name, city: input.newCollege.city, state: "" };
      DEMO_COLLEGES.push(college);
      collegeId = college.id;
    }

    demoProfile = {
      ...demoProfile,
      name: input.name,
      skills: input.skills,
      collegeId: collegeId ?? null,
      collegeName: college?.name ?? null,
      city: college?.city ?? demoProfile.city,
      state: college?.state ?? demoProfile.state,
      profileComplete: true,
    };
    return demoProfile;
  }

  const res = await fetch(`${API_BASE}/api/me`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Couldn't save your profile.");
  }
  return res.json();
}

export async function searchColleges(query: string): Promise<CollegeOption[]> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 150));
    const q = query.trim().toLowerCase();
    return q ? DEMO_COLLEGES.filter((c) => c.name.toLowerCase().includes(q)) : DEMO_COLLEGES;
  }
  const res = await fetch(`${API_BASE}/api/colleges?query=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Couldn't search colleges.");
  return res.json();
}

export async function searchEvents(query: string): Promise<EventOption[]> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 150));
    const q = query.trim().toLowerCase();
    return q ? DEMO_EVENTS.filter((e) => e.name.toLowerCase().includes(q)) : DEMO_EVENTS;
  }
  const res = await fetch(`${API_BASE}/api/events?query=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Couldn't search events.");
  return res.json();
}

export async function createEvent(input: {
  name: string;
  organizer: string;
  link: string;
}): Promise<EventOption> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 300));
    const created: EventOption = {
      id: `evt_${Date.now()}`,
      name: input.name,
      organizer: input.organizer || "Independent",
      platform: guessPlatform(input.link),
    };
    DEMO_EVENTS.push(created);
    return created;
  }
  const res = await fetch(`${API_BASE}/api/events`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Couldn't add that event.");
  }
  return res.json();
}

export async function getMyEvents(): Promise<Array<EventOption & { lookingFor: string[] }>> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 200));
    return Array.from(demoMyEvents.values()).map(({ event, lookingFor }) => ({ ...event, lookingFor }));
  }
  const res = await fetch(`${API_BASE}/api/me/events`, { credentials: "include" });
  if (!res.ok) throw new Error("Couldn't load your events.");
  return res.json();
}

export async function getMyParticipation(
  eventId: string
): Promise<{ exists: boolean; lookingFor: string[] }> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 200));
    const entry = demoMyEvents.get(eventId);
    return entry ? { exists: true, lookingFor: entry.lookingFor } : { exists: false, lookingFor: [] };
  }
  const res = await fetch(`${API_BASE}/api/events/${eventId}/participation`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Couldn't check your participation.");
  return res.json();
}

export async function setMyParticipation(eventId: string, lookingFor: string[]): Promise<void> {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 300));
    const event = DEMO_EVENTS.find((e) => e.id === eventId);
    if (event) demoMyEvents.set(eventId, { event, lookingFor });
    return;
  }
  const res = await fetch(`${API_BASE}/api/events/${eventId}/participation`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lookingFor }),
  });
  if (!res.ok) throw new Error("Couldn't save that.");
}
