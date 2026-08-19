import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername, isUsernameTaken, isValidUsernameFormat } from "@/lib/username";

function shapeProfile(u: {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  city: string | null;
  state: string | null;
  skills: string[];
  collegeId: string | null;
  college: { id: string; name: string; city: string; state: string } | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  portfolioUrl: string | null;
}) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    city: u.city,
    state: u.state,
    skills: u.skills,
    collegeId: u.collegeId,
    collegeName: u.college?.name ?? null,
    bio: u.bio,
    githubUrl: u.githubUrl,
    linkedinUrl: u.linkedinUrl,
    instagramUrl: u.instagramUrl,
    twitterUrl: u.twitterUrl,
    portfolioUrl: u.portfolioUrl,
    // The two mandatory things the matching logic needs are a name and
    // *some* location signal (a college, or at minimum a city). Skills
    // are mandatory too, otherwise a card has nothing to show teammates.
    // username/bio/socials below are optional extras, never gate this.
    profileComplete: Boolean(u.name) && Boolean(u.collegeId || u.city) && u.skills.length > 0,
  };
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  let me = await prisma.user.findUnique({
    where: { id: userId },
    include: { college: true },
  });
  if (!me) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Accounts created before usernames existed won't have one yet —
  // backfill on first read rather than needing a one-off migration
  // script against a live database.
  if (!me.username) {
    const username = await generateUniqueUsername(me.email);
    me = await prisma.user.update({ where: { id: me.id }, data: { username }, include: { college: true } });
  }

  return NextResponse.json(shapeProfile(me));
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const skills = Array.isArray(body?.skills) ? (body.skills as string[]) : [];
  const collegeId = body?.collegeId as string | undefined;
  const newCollege = body?.newCollege as { name: string; city: string } | undefined;
  const usernameInput = (body?.username as string | undefined)?.trim().toLowerCase();

  // Optional extras — the profile-details form, never the mandatory
  // onboarding gate. Empty string clears a field; omitted leaves it as is.
  const bio = body?.bio as string | undefined;
  const instagramUrl = body?.instagramUrl as string | undefined;
  const twitterUrl = body?.twitterUrl as string | undefined;
  const githubUrl = body?.githubUrl as string | undefined;
  const linkedinUrl = body?.linkedinUrl as string | undefined;
  const portfolioUrl = body?.portfolioUrl as string | undefined;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!collegeId && !newCollege?.name) {
    return NextResponse.json({ error: "College (or 'not listed' + city) is required." }, { status: 400 });
  }
  if (skills.length === 0) {
    return NextResponse.json({ error: "Pick at least one skill." }, { status: 400 });
  }

  let finalUsername: string | undefined;
  if (usernameInput !== undefined && usernameInput !== "") {
    if (!isValidUsernameFormat(usernameInput)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters: lowercase letters, numbers, or underscores." },
        { status: 400 }
      );
    }
    if (await isUsernameTaken(usernameInput, userId)) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    finalUsername = usernameInput;
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
    where: { id: userId },
    data: {
      name,
      skills,
      collegeId: finalCollegeId,
      ...(finalUsername !== undefined ? { username: finalUsername } : {}),
      ...(fallbackCity ? { city: fallbackCity, state: fallbackState } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(instagramUrl !== undefined ? { instagramUrl } : {}),
      ...(twitterUrl !== undefined ? { twitterUrl } : {}),
      ...(githubUrl !== undefined ? { githubUrl } : {}),
      ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
      ...(portfolioUrl !== undefined ? { portfolioUrl } : {}),
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

  let fresh = await prisma.user.findUnique({ where: { id: updated.id }, include: { college: true } });
  if (fresh && !fresh.username) {
    const username = await generateUniqueUsername(fresh.email);
    fresh = await prisma.user.update({ where: { id: fresh.id }, data: { username }, include: { college: true } });
  }
  return NextResponse.json(shapeProfile(fresh!));
}
