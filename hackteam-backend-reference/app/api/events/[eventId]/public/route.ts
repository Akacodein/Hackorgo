import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Deliberately no auth() check — this is what a shared invite link hits
// before the visitor has an account, so it can only ever return the
// handful of non-sensitive fields below.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { links: { include: { platform: true }, take: 1 } },
  });

  if (!event) {
    return NextResponse.json({ error: "That invite link isn't valid anymore." }, { status: 404 });
  }

  return NextResponse.json({
    id: event.id,
    name: event.canonicalName,
    organizer: event.organizer,
    platform: event.links[0]?.platform.name ?? "Unlisted",
  });
}
