import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
  const colleges = await prisma.college.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(
    colleges.map((c) => ({ id: c.id, name: c.name, city: c.city, state: c.state }))
  );
}

// Lets onboarding add a college that isn't in the list yet, without
// needing an admin step first. City is required so city-level matching
// still works even without a precise lat/lng for this one.
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const city = (body?.city as string | undefined)?.trim();

  if (!name || !city) {
    return NextResponse.json({ error: "name and city are required." }, { status: 400 });
  }

  const college = await prisma.college.upsert({
    where: { name },
    update: {},
    create: { name, city, state: "", lat: 0, lng: 0 },
  });

  return NextResponse.json({ id: college.id, name: college.name, city: college.city, state: college.state });
}
