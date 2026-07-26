import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreOne } from "@/lib/scoring";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const alreadySwiped = await prisma.eventSwipe.findMany({
    where: { eventId, swiperId: me.id },
    select: { swipedId: true },
  });
  const excludeIds = [me.id, ...alreadySwiped.map((s) => s.swipedId)];

  const participations = await prisma.participation.findMany({
    where: { eventId, userId: { notIn: excludeIds } },
    include: { user: { include: { college: true } } },
  });

  const scored = participations
    .map(({ user: u, lookingFor }) => {
      const { tier, distanceKm, score } = scoreOne(u, me);
      return {
        id: u.id,
        name: u.name,
        college: u.college?.name ?? "Independent",
        city: u.city,
        state: u.state,
        distanceKm: Math.round(distanceKm * 10) / 10,
        skills: u.skills,
        lookingFor,
        bio: u.bio ?? "",
        avatarInitials: (u.name ?? "?")
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        tier,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json(scored);
}
