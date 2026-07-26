import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const iitkgp = await prisma.college.upsert({
    where: { name: "IIT Kharagpur" },
    update: {},
    create: { name: "IIT Kharagpur", city: "Kharagpur", state: "West Bengal", lat: 22.3149, lng: 87.31 },
  });
  const kce = await prisma.college.upsert({
    where: { name: "Kharagpur College of Engineering" },
    update: {},
    create: { name: "Kharagpur College of Engineering", city: "Kharagpur", state: "West Bengal", lat: 22.33, lng: 87.32 },
  });
  const ju = await prisma.college.upsert({
    where: { name: "Jadavpur University" },
    update: {},
    create: { name: "Jadavpur University", city: "Kolkata", state: "West Bengal", lat: 22.499, lng: 88.3714 },
  });
  const dtu = await prisma.college.upsert({
    where: { name: "Delhi Technological University" },
    update: {},
    create: { name: "Delhi Technological University", city: "Delhi", state: "Delhi", lat: 28.75, lng: 77.12 },
  });

  const unstop = await prisma.platform.upsert({
    where: { name: "Unstop" },
    update: {},
    create: { name: "Unstop", domain: "unstop.com" },
  });

  // Fixed id so it matches CURRENT_EVENT.id hardcoded in the frontend's demo data.
  const event = await prisma.event.upsert({
    where: { id: "evt_iitkgp_2026" },
    update: {},
    create: {
      id: "evt_iitkgp_2026",
      canonicalName: "Kshitij Hackathon",
      organizer: "IIT Kharagpur",
      type: "hackathon",
      mode: "offline",
      tags: ["hackathon"],
    },
  });

  await prisma.eventLink.upsert({
    where: { eventId_platformId: { eventId: event.id, platformId: unstop.id } },
    update: {},
    create: { eventId: event.id, platformId: unstop.id, sourceUrl: "https://unstop.com/example" },
  });

  // Give whoever signed up first (you, most likely) a college + location,
  // so "closest match first" has something real to compare against. Rerun
  // this script any time — it's safe to run repeatedly.
  const me = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (me) {
    await prisma.user.update({
      where: { id: me.id },
      data: { collegeId: iitkgp.id, city: "Kharagpur", state: "West Bengal", lat: 22.3149, lng: 87.31 },
    });
    console.log(`Set ${me.email} up as IIT Kharagpur / Kharagpur.`);
  } else {
    console.log("No signed-up user found — sign in once through the app first, then rerun this.");
  }

  const sampleTeammates = [
    {
      name: "Rohan Das",
      email: "rohan.demo@example.com",
      collegeId: iitkgp.id,
      city: "Kharagpur",
      state: "West Bengal",
      lat: 22.316,
      lng: 87.309,
      skills: ["React", "Node.js"],
      lookingFor: ["Machine Learning", "Backend"],
    },
    {
      name: "Ankita Verma",
      email: "ankita.demo@example.com",
      collegeId: kce.id,
      city: "Kharagpur",
      state: "West Bengal",
      lat: 22.33,
      lng: 87.32,
      skills: ["Python", "TensorFlow"],
      lookingFor: ["Frontend", "UI/UX Design"],
    },
    {
      name: "Sourav Ghosh",
      email: "sourav.demo@example.com",
      collegeId: ju.id,
      city: "Kolkata",
      state: "West Bengal",
      lat: 22.499,
      lng: 88.3714,
      skills: ["Node.js", "PostgreSQL"],
      lookingFor: ["Frontend", "UI/UX Design"],
    },
    {
      name: "Aditya Malhotra",
      email: "aditya.demo@example.com",
      collegeId: dtu.id,
      city: "Delhi",
      state: "Delhi",
      lat: 28.75,
      lng: 77.12,
      skills: ["Flutter", "Firebase"],
      lookingFor: ["Backend"],
    },

    {
      name: "Priya Sharma",
      email: "priya.demo@example.com",
      collegeId: ju.id,
      city: "Kolkata",
      state: "West Bengal",
      lat: 22.499,
      lng: 88.3714,
      skills: ["Java", "Spring Boot"],
      lookingFor: ["React", "UI/UX Design"],
    },

    {
      name: "Arjun Singh",
      email: "arjun.demo@example.com",
      collegeId: dtu.id,
      city: "Delhi",
      state: "Delhi",
      lat: 28.75,
      lng: 77.12,
      skills: ["Python", "AI"],
      lookingFor: ["Backend", "Database"],
    },
  ];

  for (const person of sampleTeammates) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {},
      create: {
        email: person.email,
        name: person.name,
        collegeId: person.collegeId,
        city: person.city,
        state: person.state,
        lat: person.lat,
        lng: person.lng,
        skills: person.skills,
        emailVerified: new Date(),
      },
    });

    await prisma.participation.upsert({
      where: { userId_eventId: { userId: user.id, eventId: event.id } },
      update: {},
      create: {
        userId: user.id,
        eventId: event.id,
        platformId: unstop.id,
        status: "registered",
        source: "manual",
        verified: true,
        lookingFor: person.lookingFor,
      },
    });
  }

  console.log(`Seed complete — ${sampleTeammates.length} sample teammates registered for "${event.canonicalName}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
