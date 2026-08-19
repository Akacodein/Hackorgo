import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Usage: npx tsx prisma/reset-swipes.ts [eventId]
// Defaults to the seeded demo event if no id is passed.
const eventId = process.argv[2] ?? "evt_iitkgp_2026";

async function main() {
  const swipes = await prisma.eventSwipe.deleteMany({ where: { eventId } });
  const matches = await prisma.match.deleteMany({ where: { eventId } });
  console.log(
    `Cleared ${swipes.count} swipe(s) and ${matches.count} match(es) for event "${eventId}". Reload the app to see everyone again.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
