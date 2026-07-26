import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const participations = await prisma.participation.findMany({
    where: { userId: session.user.id },
    include: { event: { include: { links: { include: { platform: true }, take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    participations.map((p) => ({
      id: p.event.id,
      name: p.event.canonicalName,
      organizer: p.event.organizer,
      platform: p.event.links[0]?.platform.name ?? "Unlisted",
      lookingFor: p.lookingFor,
    }))
  );
}
