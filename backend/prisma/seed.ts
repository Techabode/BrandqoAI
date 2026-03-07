import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@brandqoai.test";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log("Demo user already exists");
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: "demo-password-not-for-production",
      name: "Demo Creator",
      timezone: "UTC",
    },
  });

  const brand = await prisma.brandProfile.create({
    data: {
      userId: user.id,
      brandName: "Demo Brand",
      industry: "Creator",
      targetAudience: "Creators testing BrandqoAI",
      toneOfVoice: "friendly, helpful, concise",
      keywords: "creator economy, content, social media",
      contentPillars: "education,inspiration,launches",
    },
  });

  await prisma.preferenceProfile.create({
    data: {
      brandId: brand.id,
      postingFrequency: "3_per_week",
      bannedTopics: "",
      languages: "en",
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seeded demo user and brand");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

