import type {
  ChatMessage,
  CollegeOption,
  CurrentUser,
  EventOption,
  MatchSummary,
  MyProfile,
  ScoredCandidate,
  SwipeDirection,
} from "../types";
import { MOCK_CANDIDATES, ME, CURRENT_EVENT } from "../data/mockCandidates";
import { scoreCandidates } from "./scoring";
import { authedFetch } from "./authClient";

// unset (undefined) -> demo mode; "" -> same-origin relative calls; URL -> separate origin
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const DEMO_MODE = RAW_API_BASE === undefined;

// People who (in this demo) already swiped right on you, so you can see
// the match modal fire. In production this is just whatever the
// candidates/swipe route in hackteam-backend-reference returns.
const DEMO_ALREADY_INTERESTED = new Set(["c1", "c4"]);

// A few usernames already "taken" in demo mode, so the availability
// check has something real to reject while testing.
const DEMO_TAKEN_USERNAMES = new Set(["rohandas", "ankitaverma", "priyasharma", "souravghosh"]);

const DEMO_COLLEGES: CollegeOption[] = [
  { id: "col_iitkgp", name: "IIT Kharagpur", city: "Kharagpur", state: "West Bengal" },
  { id: "col_kce", name: "Kharagpur College of Engineering", city: "Kharagpur", state: "West Bengal" },
  { id: "col_ju", name: "Jadavpur University", city: "Kolkata", state: "West Bengal" },
  { id: "col_dtu", name: "Delhi Technological University", city: "Delhi", state: "Delhi" },
];

// Seed the picker with the one event the mock candidates belong to, so
// demo mode has something to find/select right away.
const DEMO_EVENTS: EventOption[] = [
  {
    id: CURRENT_EVENT.id,
    name: CURRENT_EVENT.name,
    organizer: CURRENT_EVENT.organizer,
    platform: CURRENT_EVENT.platform,
    url: "https://unstop.com/example-kshitij",
  },
];

// Demo-mode profile, in memory only — starts incomplete on purpose, so
// the onboarding step is easy to see without a backend attached. Once
// you complete it, it's remembered for the rest of this page session.
let demoProfile: MyProfile = {
  id: "demo-user",
  name: null,
  username: null,
  email: "you@example.edu",
  city: null,
  state: null,
  skills: [],
  collegeId: null,
  collegeName: null,
  bio: null,
  githubUrl: null,
  linkedinUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  portfolioUrl: null,
  profileComplete: false,
};

// Events the demo user has said they're looking for teammates for,
// keyed by event id — starts empty so the "add your first event" flow
// is easy to see too.
const demoMyEvents = new Map<string, { event: EventOption; lookingFor: string[] }>();

interface DemoMatch {
  matchId: string;
  eventName: string;
  otherUser: MatchSummary["otherUser"];
  messages: ChatMessage[];
}
// Keyed by matchId — populated the first time a demo swipe produces a match.
const demoMatches = new Map<string, DemoMatch>();
const AUTO_REPLIES = [
  "Sounds good — what have you built before?",
  "Nice! When are you free to sync?",
  "I'm in. Let's split up who's doing what.",
];

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

export async function fetchCandidates(): Promise<ScoredCandidate[]> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 400));
    // Score against whatever was entered during onboarding, not the
    // hardcoded mock persona — otherwise the tiers on screen wouldn't
    // match the profile you just filled in.
    const me: CurrentUser = {
      ...ME,
      name: demoProfile.name ?? ME.name,
      college: demoProfile.collegeName ?? ME.college,
      city: demoProfile.city ?? ME.city,
      state: demoProfile.state ?? ME.state,
    };
    return scoreCandidates(MOCK_CANDIDATES, me);
  }
  const res = await authedFetch(`/api/candidates`);
  if (!res.ok) throw new Error("Couldn't load people to swipe through.");
  return res.json();
}

export async function recordSwipe(
  eventId: string,
  candidateId: string,
  direction: SwipeDirection
): Promise<{ matched: boolean }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    const matched = direction === "right" && DEMO_ALREADY_INTERESTED.has(candidateId);
    if (matched) {
      const matchId = `match_${candidateId}`;
      if (!demoMatches.has(matchId)) {
        const candidate = MOCK_CANDIDATES.find((c) => c.id === candidateId);
        demoMatches.set(matchId, {
          matchId,
          eventName: candidate?.eventName ?? CURRENT_EVENT.name,
          otherUser: {
            id: candidateId,
            name: candidate?.name ?? "Someone",
            college: candidate?.college ?? "",
            avatarInitials: candidate?.avatarInitials ?? "?",
          },
          messages: [
            { id: "seed", body: "Hey! Excited to team up 🎉", fromMe: false, createdAt: new Date().toISOString() },
          ],
        });
      }
    }
    return { matched };
  }
  const res = await authedFetch(`/api/events/${eventId}/swipe`, {
    method: "POST",
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
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 300));
    return demoProfile;
  }
  const res = await authedFetch(`/api/me`);
  if (!res.ok) throw new Error("Couldn't load your profile.");
  return res.json();
}

export async function saveMyProfile(input: {
  name: string;
  collegeId?: string;
  newCollege?: { name: string; city: string };
  skills: string[];
  username?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
}): Promise<MyProfile> {
  if (DEMO_MODE) {
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
      username: input.username || demoProfile.username || input.name.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user",
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.githubUrl !== undefined ? { githubUrl: input.githubUrl } : {}),
      ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl } : {}),
      ...(input.instagramUrl !== undefined ? { instagramUrl: input.instagramUrl } : {}),
      ...(input.twitterUrl !== undefined ? { twitterUrl: input.twitterUrl } : {}),
      ...(input.portfolioUrl !== undefined ? { portfolioUrl: input.portfolioUrl } : {}),
      profileComplete: true,
    };
    return demoProfile;
  }

  const res = await authedFetch(`/api/me`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Couldn't save your profile.");
  }
  return res.json();
}

export async function checkUsername(value: string): Promise<{ available: boolean; reason: "format" | "taken" | null }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    if (!/^[a-z0-9_]{3,20}$/.test(value)) return { available: false, reason: "format" };
    const taken = DEMO_TAKEN_USERNAMES.has(value) && value !== demoProfile.username;
    return { available: !taken, reason: taken ? "taken" : null };
  }
  const res = await authedFetch(`/api/me/username-check?value=${encodeURIComponent(value)}`);
  if (!res.ok) return { available: false, reason: null };
  return res.json();
}

export async function searchColleges(query: string): Promise<CollegeOption[]> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    const q = query.trim().toLowerCase();
    return q ? DEMO_COLLEGES.filter((c) => c.name.toLowerCase().includes(q)) : DEMO_COLLEGES;
  }
  const res = await authedFetch(`/api/colleges?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Couldn't search colleges.");
  return res.json();
}

export async function searchEvents(query: string): Promise<EventOption[]> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    const q = query.trim().toLowerCase();
    return q ? DEMO_EVENTS.filter((e) => e.name.toLowerCase().includes(q)) : DEMO_EVENTS;
  }
  const res = await authedFetch(`/api/events?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Couldn't search events.");
  return res.json();
}

export async function createEvent(input: {
  name: string;
  organizer: string;
  link: string;
}): Promise<EventOption> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 300));
    const created: EventOption = {
      id: `evt_${Date.now()}`,
      name: input.name,
      organizer: input.organizer || "Independent",
      platform: guessPlatform(input.link),
      url: input.link,
    };
    DEMO_EVENTS.push(created);
    return created;
  }
  const res = await authedFetch(`/api/events`, {
    method: "POST",
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
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    return Array.from(demoMyEvents.values()).map(({ event, lookingFor }) => ({ ...event, lookingFor }));
  }
  const res = await authedFetch(`/api/me/events`);
  if (!res.ok) throw new Error("Couldn't load your events.");
  return res.json();
}

export async function getMyParticipation(
  eventId: string
): Promise<{ exists: boolean; lookingFor: string[] }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    const entry = demoMyEvents.get(eventId);
    return entry ? { exists: true, lookingFor: entry.lookingFor } : { exists: false, lookingFor: [] };
  }
  const res = await authedFetch(`/api/events/${eventId}/participation`);
  if (!res.ok) throw new Error("Couldn't check your participation.");
  return res.json();
}

export async function setMyParticipation(eventId: string, lookingFor: string[]): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 300));
    const event = DEMO_EVENTS.find((e) => e.id === eventId);
    if (event) demoMyEvents.set(eventId, { event, lookingFor });
    return;
  }
  const res = await authedFetch(`/api/events/${eventId}/participation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lookingFor }),
  });
  if (!res.ok) throw new Error("Couldn't save that.");
}

// Public — no auth — used by the invite-landing screen for someone who
// hasn't signed up yet. Deliberately a plain fetch, not authedFetch: no
// token needed, and we don't want a 401 here (there won't be one) to
// trip the token-clearing logic in authedFetch.
export async function getPublicEvent(eventId: string): Promise<EventOption | null> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    return DEMO_EVENTS.find((e) => e.id === eventId) ?? null;
  }
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
  const res = await fetch(`${API_BASE}/api/events/${eventId}/public`);
  if (!res.ok) return null;
  return res.json();
}

export async function getMyMatches(): Promise<MatchSummary[]> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 250));
    return Array.from(demoMatches.values())
      .map((m) => {
        const last = m.messages[m.messages.length - 1];
        return {
          matchId: m.matchId,
          eventName: m.eventName,
          otherUser: m.otherUser,
          lastMessage: last ? { body: last.body, fromMe: last.fromMe, at: last.createdAt } : null,
          matchedAt: m.messages[0]?.createdAt ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => (a.lastMessage?.at ?? "").localeCompare(b.lastMessage?.at ?? "") * -1);
  }
  const res = await authedFetch(`/api/me/matches`);
  if (!res.ok) throw new Error("Couldn't load your conversations.");
  return res.json();
}

export async function getMessages(matchId: string): Promise<ChatMessage[]> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    return demoMatches.get(matchId)?.messages ?? [];
  }
  const res = await authedFetch(`/api/matches/${matchId}/messages`);
  if (!res.ok) throw new Error("Couldn't load that conversation.");
  return res.json();
}

export async function sendMessage(matchId: string, body: string): Promise<ChatMessage> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    const match = demoMatches.get(matchId);
    const message: ChatMessage = { id: `m_${Date.now()}`, body, fromMe: true, createdAt: new Date().toISOString() };
    if (match) {
      match.messages.push(message);
      // A canned auto-reply so testing the thread feels alive.
      window.setTimeout(() => {
        const reply: ChatMessage = {
          id: `m_${Date.now() + 1}`,
          body: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
          fromMe: false,
          createdAt: new Date().toISOString(),
        };
        match.messages.push(reply);
      }, 1200);
    }
    return message;
  }
  const res = await authedFetch(`/api/matches/${matchId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error("Couldn't send that.");
  return res.json();
}
