import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function shapeProfile(u: {
  id: string;
  name: string | null;
  email: string;
  city: string | null;
  state: string | null;
  skills: string[];
  collegeId: string | null;
  college: { id: string; name: string; city: string; state: string } | null;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    city: u.city,
    state: u.state,
    skills: u.skills,
    collegeId: u.collegeId,
    collegeName: u.college?.name ?? null,
    // The two mandatory things the matching logic needs are a name and
    // *some* location signal (a college, or at minimum a city). Skills
    // are mandatory too, otherwise a card has nothing to show teammates.
    profileComplete: Boolean(u.name) && Boolean(u.collegeId || u.city) && u.skills.length > 0,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { college: true },
  });
  if (!me) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json(shapeProfile(me));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const skills = Array.isArray(body?.skills) ? (body.skills as string[]) : [];
  const collegeId = body?.collegeId as string | undefined;
  const newCollege = body?.newCollege as { name: string; city: string } | undefined;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!collegeId && !newCollege?.name) {
    return NextResponse.json({ error: "College (or 'not listed' + city) is required." }, { status: 400 });
  }
  if (skills.length === 0) {
    return NextResponse.json({ error: "Pick at least one skill." }, { status: 400 });
  }

  let finalCollegeId = collegeId ?? null;
  let fallbackCity: string | undefined;
  let fallbackState: string | undefined;

  if (!finalCollegeId && newCollege?.name) {
    if (!newCollege.city?.trim()) {
      return NextResponse.json({ error: "City is required for a new college." }, { status: 400 });
    }
    // Reuse an existing row with the same name instead of creating a
    // duplicate if someone else already added it moments ago.
    const college = await prisma.college.upsert({
      where: { name: newCollege.name.trim() },
      update: {},
      create: {
        name: newCollege.name.trim(),
        city: newCollege.city.trim(),
        state: "",
        lat: 0,
        lng: 0,
      },
    });
    finalCollegeId = college.id;
    fallbackCity = college.city;
    fallbackState = college.state || undefined;
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      skills,
      collegeId: finalCollegeId,
      ...(fallbackCity ? { city: fallbackCity, state: fallbackState } : {}),
    },
    include: { college: true },
  });

  // If they picked an EXISTING college, mirror its city/state onto the
  // user too, so city/state-level matching still works for anyone whose
  // college doesn't have a precise lat/lng.
  if (collegeId && updated.college) {
    await prisma.user.update({
      where: { id: updated.id },
      data: { city: updated.college.city, state: updated.college.state, lat: updated.college.lat, lng: updated.college.lng },
    });
  }

  const fresh = await prisma.user.findUnique({ where: { id: updated.id }, include: { college: true } });
  return NextResponse.json(shapeProfile(fresh!));
}
