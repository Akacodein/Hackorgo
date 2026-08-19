import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

async function assertParticipant(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;
  if (match.userAId !== userId && match.userBId !== userId) return null;
  return match;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const match = await assertParticipant(matchId, userId);
  if (!match) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      body: m.body,
      fromMe: m.senderId === userId,
      createdAt: m.createdAt,
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const match = await assertParticipant(matchId, userId);
  if (!match) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const text = (body?.body as string | undefined)?.trim();
  if (!text) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "That's a bit long." }, { status: 400 });

  const message = await prisma.message.create({
    data: { matchId, senderId: userId, body: text },
  });

  return NextResponse.json({ id: message.id, body: message.body, fromMe: true, createdAt: message.createdAt });
}
