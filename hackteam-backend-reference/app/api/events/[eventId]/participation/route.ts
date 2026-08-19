import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const participation = await prisma.participation.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  return NextResponse.json({
    exists: Boolean(participation),
    lookingFor: participation?.lookingFor ?? [],
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const lookingFor = Array.isArray(body?.lookingFor) ? (body.lookingFor as string[]) : [];
  if (lookingFor.length === 0) {
    return NextResponse.json({ error: "Pick at least one thing you're looking for." }, { status: 400 });
  }

  const participation = await prisma.participation.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: { lookingFor },
    create: {
      userId,
      eventId,
      status: "interested",
      source: "manual",
      lookingFor,
    },
  });

  return NextResponse.json({ exists: true, lookingFor: participation.lookingFor });
}
