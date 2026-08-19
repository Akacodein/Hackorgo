import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { scoreOne } from "@/lib/scoring";

// Dwarfs the proximity score (which tops out at 3000, see lib/scoring.ts)
// so every candidate for one of MY events outranks every candidate for
// someone else's event, regardless of how close that other person is —
// then within each of those two groups, college/city/state still sorts
// normally. This is the whole "your event first, then everyone else"
// behavior, expressed as one number.
const MY_EVENT_BONUS = 10_000;

export async function GET(req: NextRequest) {
  const meId = await getUserId(req);
  if (!meId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const me = await prisma.user.findUnique({ where: { id: meId } });
  if (!me) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const myParticipations = await prisma.participation.findMany({
    where: { userId: meId },
    select: { eventId: true },
  });
  const myEventIds = new Set(myParticipations.map((p) => p.eventId));

  const alreadySwiped = await prisma.eventSwipe.findMany({
    where: { swiperId: meId },
    select: { eventId: true, swipedId: true },
  });
  const swipedPairs = new Set(alreadySwiped.map((s) => `${s.eventId}:${s.swipedId}`));

  const participations = await prisma.participation.findMany({
    where: { userId: { not: meId } },
    include: {
      user: { include: { college: true } },
      event: { include: { links: { include: { platform: true }, take: 1 } } },
    },
    // A reasonable cap for now — revisit with real pagination once a
    // single user's platform-wide pool is actually large enough to need it.
    take: 500,
  });

  const scored = participations
    .filter((p) => !swipedPairs.has(`${p.eventId}:${p.userId}`))
    .map((p) => {
      const u = p.user;
      const { tier, distanceKm, score: proximityScore } = scoreOne(u, me);
      const isMyEvent = myEventIds.has(p.eventId);
      return {
        id: u.id,
        name: u.name,
        college: u.college?.name ?? "Independent",
        city: u.city,
        state: u.state,
        distanceKm: Math.round(distanceKm * 10) / 10,
        skills: u.skills,
        lookingFor: p.lookingFor,
        bio: u.bio ?? "",
        avatarInitials: (u.name ?? "?")
          .split(" ")
          .map((c) => c[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        tier,
        eventId: p.eventId,
        eventName: p.event.canonicalName,
        eventOrganizer: p.event.organizer,
        eventPlatform: p.event.links[0]?.platform.name ?? "Unlisted",
        eventUrl: p.event.links[0]?.sourceUrl ?? null,
        isMyEvent,
        score: proximityScore + (isMyEvent ? MY_EVENT_BONUS : 0),
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json(scored);
}
