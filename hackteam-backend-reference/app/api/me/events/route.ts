import { NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const userId = await getUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const participations = await prisma.participation.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          links: {
            include: { platform: true },
            take: 1,
          },
        },
      },
    },
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
