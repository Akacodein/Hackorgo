import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const meId = await getUserId(req);
  if (!meId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const candidateId = body?.candidateId as string | undefined;
  const direction = body?.direction as "left" | "right" | undefined;

  if (!candidateId || (direction !== "left" && direction !== "right")) {
    return NextResponse.json({ error: "candidateId and direction are required." }, { status: 400 });
  }
  if (candidateId === meId) {
    return NextResponse.json({ error: "Can't swipe on yourself." }, { status: 400 });
  }

  await prisma.eventSwipe.upsert({
    where: { eventId_swiperId_swipedId: { eventId, swiperId: meId, swipedId: candidateId } },
    update: { direction },
    create: { eventId, swiperId: meId, swipedId: candidateId, direction },
  });

  if (direction === "right") {
    // Not scoped to this eventId on purpose: in the universal feed, two
    // people can right-swipe each other while looking at different
    // events (A saw B's listing for event Y, B saw A's listing for
    // event X) — that's still a match, so we check for ANY reciprocal
    // right-swipe rather than requiring the same event on both sides.
    const reciprocal = await prisma.eventSwipe.findFirst({
      where: { swiperId: candidateId, swipedId: meId, direction: "right" },
    });

    if (reciprocal) {
      const [userAId, userBId] = [meId, candidateId].sort();
      // Two people can only ever have one conversation between them,
      // even if they end up mutually interested via more than one event
      // — check before creating, rather than relying on the eventId
      // being part of the uniqueness (it no longer uniquely identifies
      // "this pair" the way it did in the single-event model).
      const existingMatch = await prisma.match.findFirst({ where: { userAId, userBId } });
      if (!existingMatch) {
        await prisma.match.create({ data: { eventId, userAId, userBId } });
      }
      return NextResponse.json({ matched: true });
    }
  }

  return NextResponse.json({ matched: false });
}
