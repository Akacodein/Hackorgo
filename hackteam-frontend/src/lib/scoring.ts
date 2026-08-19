import type { Candidate, CurrentUser, MatchTier, ScoredCandidate } from "../types";

/**
 * Great-circle distance between two lat/lng points, in kilometres.
 * Good enough for "how far away is this person" — no need for PostGIS
 * at this scale. If you outgrow this, Neon supports the PostGIS
 * extension and you can move this into a SQL query instead.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tiering is deliberately categorical rather than one continuous
 * score — "same college" should never lose to "42km closer but a
 * stranger's college", and a tiered badge is also what gets shown
 * on the card, so the sort order and the UI copy stay in sync.
 */
export function tierFor(
  candidate: Candidate,
  me: Pick<CurrentUser, "college" | "city" | "state">
): MatchTier {
  if (candidate.college === me.college) return "college";
  if (candidate.city === me.city) return "city";
  if (candidate.state === me.state) return "state";
  return "far";
}

const TIER_WEIGHT: Record<MatchTier, number> = {
  college: 3000,
  city: 2000,
  state: 1000,
  far: 0,
};

// Same idea as MY_EVENT_BONUS on the backend — dwarfs the proximity
// score so every candidate for one of my events outranks every
// candidate for someone else's, and college/city/state still sorts
// normally within each of those two groups.
const MY_EVENT_BONUS = 10_000;

export function scoreCandidates(
  candidates: Candidate[],
  me: CurrentUser
): ScoredCandidate[] {
  return candidates
    .map((c) => {
      const tier = tierFor(c, me);
      // Within a tier, closer people still sort first. Distance is
      // subtracted so smaller distance -> higher score, capped so it
      // can never leak into the tier above it.
      const distancePenalty = Math.min(c.distanceKm, 999);
      const score = TIER_WEIGHT[tier] - distancePenalty + (c.isMyEvent ? MY_EVENT_BONUS : 0);
      return { ...c, tier, score };
    })
    .sort((a, b) => b.score - a.score);
}

export const TIER_LABEL: Record<MatchTier, string> = {
  college: "Same college",
  city: "Same city",
  state: "Same state",
  far: "Different state",
};
