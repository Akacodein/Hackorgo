import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

function initialsOf(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export async function GET(req: NextRequest) {
  const meId = await getUserId(req);
  if (!meId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: meId }, { userBId: meId }] },
    include: {
      event: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { matchedAt: "desc" },
  });

  const otherIds = matches.map((m) => (m.userAId === meId ? m.userBId : m.userAId));
  const others = await prisma.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, college: { select: { name: true } } },
  });
  const otherById = new Map(others.map((u) => [u.id, u]));

  const shaped = matches.map((m) => {
    const otherId = m.userAId === meId ? m.userBId : m.userAId;
    const other = otherById.get(otherId);
    const lastMessage = m.messages[0];
    return {
      matchId: m.id,
      eventName: m.event.canonicalName,
      otherUser: {
        id: otherId,
        name: other?.name ?? "Someone",
        college: other?.college?.name ?? "",
        avatarInitials: initialsOf(other?.name ?? null),
      },
      lastMessage: lastMessage
        ? { body: lastMessage.body, fromMe: lastMessage.senderId === meId, at: lastMessage.createdAt }
        : null,
      matchedAt: m.matchedAt,
    };
  });

  return NextResponse.json(shaped);
}
