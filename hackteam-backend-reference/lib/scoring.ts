export type MatchTier = "college" | "city" | "state" | "far";

interface Locatable {
  collegeId: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function tierFor(candidate: Locatable, me: Locatable): MatchTier {
  if (candidate.collegeId && candidate.collegeId === me.collegeId) return "college";
  if (candidate.city && candidate.city === me.city) return "city";
  if (candidate.state && candidate.state === me.state) return "state";
  return "far";
}

const TIER_WEIGHT: Record<MatchTier, number> = { college: 3000, city: 2000, state: 1000, far: 0 };

export function scoreOne(candidate: Locatable, me: Locatable) {
  const tier = tierFor(candidate, me);
  const distanceKm =
    me.lat != null && me.lng != null && candidate.lat != null && candidate.lng != null
      ? haversineKm(me.lat, me.lng, candidate.lat, candidate.lng)
      : 9999;
  const score = TIER_WEIGHT[tier] - Math.min(distanceKm, 999);
  return { tier, distanceKm, score };
}

// At real scale, push this into the SQL query (raw Haversine + ORDER BY,
// or a PostGIS ST_Distance query — Neon supports the PostGIS extension)
// instead of scoring in Node after fetching everyone. Fine up to a few
// thousand participants per event.
