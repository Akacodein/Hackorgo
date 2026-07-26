import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const participation = await prisma.participation.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId } },
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const lookingFor = Array.isArray(body?.lookingFor) ? (body.lookingFor as string[]) : [];
  if (lookingFor.length === 0) {
    return NextResponse.json({ error: "Pick at least one thing you're looking for." }, { status: 400 });
  }

  const participation = await prisma.participation.upsert({
    where: { userId_eventId: { userId: session.user.id, eventId } },
    update: { lookingFor },
    create: {
      userId: session.user.id,
      eventId,
      status: "interested",
      source: "manual",
      lookingFor,
    },
  });

  return NextResponse.json({ exists: true, lookingFor: participation.lookingFor });
}
