import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const meId = session.user.id;

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
    const reciprocal = await prisma.eventSwipe.findUnique({
      where: {
        eventId_swiperId_swipedId: { eventId, swiperId: candidateId, swipedId: meId },
      },
    });

    if (reciprocal?.direction === "right") {
      const [userAId, userBId] = [meId, candidateId].sort();
      await prisma.match.upsert({
        where: { eventId_userAId_userBId: { eventId, userAId, userBId } },
        update: {},
        create: { eventId, userAId, userBId },
      });
      return NextResponse.json({ matched: true });
    }
  }

  return NextResponse.json({ matched: false });
}
