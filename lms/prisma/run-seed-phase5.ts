/** Standalone entry point for the Phase 5/6 seed: `npm run db:seed:phase5`. */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedPhase5 } from "./seed-phase5";

(async () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  console.log("Seeding Phase 5/6 fixtures…");
  await seedPhase5(prisma);
  console.log("Done.");
  await prisma.$disconnect();
})();
