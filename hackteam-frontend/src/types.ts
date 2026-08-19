export type MatchTier = "college" | "city" | "state" | "far";

export interface Candidate {
  id: string;
  name: string;
  college: string;
  city: string;
  state: string;
  distanceKm: number;
  skills: string[];
  lookingFor: string[];
  bio: string;
  githubUrl?: string;
  avatarInitials: string;
  eventId: string;
  eventName: string;
  eventOrganizer: string;
  eventPlatform: string;
  eventUrl: string | null;
  isMyEvent: boolean;
}

export interface ScoredCandidate extends Candidate {
  tier: MatchTier;
  score: number;
}

export type SwipeDirection = "left" | "right";

export interface EventInfo {
  id: string;
  name: string;
  organizer: string;
  platform: string;
  mode: "online" | "offline" | "hybrid";
  dateLabel: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  college: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface CollegeOption {
  id: string;
  name: string;
  city: string;
  state: string;
}

export interface MyProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  city: string | null;
  state: string | null;
  skills: string[];
  collegeId: string | null;
  collegeName: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  portfolioUrl: string | null;
  profileComplete: boolean;
}

export type AuthMode = "signup" | "signin";

export interface EventOption {
  id: string;
  name: string;
  organizer: string;
  platform: string;
  url: string | null;
}

export interface MatchSummary {
  matchId: string;
  eventName: string;
  otherUser: { id: string; name: string; college: string; avatarInitials: string };
  lastMessage: { body: string; fromMe: boolean; at: string } | null;
  matchedAt: string;
}

export interface ChatMessage {
  id: string;
  body: string;
  fromMe: boolean;
  createdAt: string;
}



