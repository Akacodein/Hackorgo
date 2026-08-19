import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { derivePlatform } from "@/lib/platform";

function shapeEvent(
  e: { id: string; canonicalName: string; organizer: string },
  platformName: string,
  url: string | null
) {
  return { id: e.id, name: e.canonicalName, organizer: e.organizer, platform: platformName, url };
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
  const events = await prisma.event.findMany({
    where: query ? { canonicalName: { contains: query, mode: "insensitive" } } : undefined,
    include: { links: { include: { platform: true }, take: 1 } },
    orderBy: { canonicalName: "asc" },
    take: 20,
  });

  return NextResponse.json(
    events.map((e) => shapeEvent(e, e.links[0]?.platform.name ?? "Unlisted", e.links[0]?.sourceUrl ?? null))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const organizer = (body?.organizer as string | undefined)?.trim();
  const link = (body?.link as string | undefined)?.trim();

  if (!name) return NextResponse.json({ error: "Event name is required." }, { status: 400 });
  if (!link) return NextResponse.json({ error: "Paste a link to the event." }, { status: 400 });

  const { name: platformName, domain } = derivePlatform(link);

  const platform = await prisma.platform.upsert({
    where: { name: platformName },
    update: {},
    create: { name: platformName, domain },
  });

  // Same real-world event might get added twice under a slightly
  // different name — that's a known limitation noted in lib/scoring.ts's
  // neighbor; for now every submission gets its own Event row.
  const event = await prisma.event.create({
    data: {
      canonicalName: name,
      organizer: organizer || "Independent",
      type: "hackathon",
      mode: "offline",
    },
  });

  await prisma.eventLink.create({
    data: { eventId: event.id, platformId: platform.id, sourceUrl: link },
  });

  return NextResponse.json(shapeEvent(event, platform.name, link));
}
