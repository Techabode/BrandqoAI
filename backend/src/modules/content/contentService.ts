import { prisma } from "../../db/client";
import { createProvider } from "../ai/provider";
import { sendWhatsAppTextMessage } from "../whatsapp/whatsappApi";

interface GenerateContentParams {
  brandId: string;
  userPrompt: string;
}

interface GeneratedPostTemplate {
  caption: string;
  imagePrompt: string;
}

interface GeneratedCalendarEntry {
  date?: string;
  topic: string;
  caption: string;
  platforms: Array<"INSTAGRAM" | "FACEBOOK" | "TWITTER">;
  scheduledAt: Date;
}

interface CalendarGenerationResult {
  attempt: number;
  count: number;
  entries: Array<{
    scheduledDate: string;
    topic: string;
    platforms: Array<"INSTAGRAM" | "FACEBOOK" | "TWITTER">;
    postTemplateIds: string[];
  }>;
}

const buildBrandContext = (brand: {
  brandName: string;
  industry: string | null;
  targetAudience: string | null;
  toneOfVoice: string | null;
  contentPillars: string | null;
  logoUrl: string | null;
}) => {
  return [
    `Brand name: ${brand.brandName}`,
    brand.industry ? `Industry: ${brand.industry}` : null,
    brand.targetAudience ? `Target audience: ${brand.targetAudience}` : null,
    brand.toneOfVoice ? `Tone of voice: ${brand.toneOfVoice}` : null,
    brand.contentPillars ? `Content pillars: ${brand.contentPillars}` : null,
    brand.logoUrl ? `Brand logo URL: ${brand.logoUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

const getPostsPer30Days = (postingFrequency: string | null | undefined): number => {
  switch (postingFrequency) {
    case "daily":
      return 30;
    case "3_per_week":
      return 13;
    case "weekly":
    default:
      return 4;
  }
};

const getDaySpacing = (postingFrequency: string | null | undefined): number => {
  switch (postingFrequency) {
    case "daily":
      return 1;
    case "3_per_week":
      return 2;
    case "weekly":
    default:
      return 7;
  }
};

const deriveScheduleDate = (index: number, postingFrequency: string | null | undefined): Date => {
  const date = new Date();
  date.setUTCHours(10, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + index * getDaySpacing(postingFrequency));
  return date;
};

const normalizePlatform = (value: string | null | undefined): "INSTAGRAM" | "FACEBOOK" | "TWITTER" => {
  if (value === "FACEBOOK" || value === "TWITTER" || value === "INSTAGRAM") {
    return value;
  }
  return "INSTAGRAM";
};

const normalizePlatforms = (value: unknown): Array<"INSTAGRAM" | "FACEBOOK" | "TWITTER"> => {
  if (Array.isArray(value)) {
    const normalized = value
      .map((platform) => normalizePlatform(typeof platform === "string" ? platform.toUpperCase() : undefined))
      .filter((platform, index, list) => list.indexOf(platform) === index);

    if (normalized.length) {
      return normalized;
    }
  }

  if (typeof value === "string") {
    return [normalizePlatform(value.toUpperCase())];
  }

  return ["INSTAGRAM"];
};

const parseScheduledAt = (value: string | undefined, fallback: Date): Date => {
  if (!value) {
    return fallback;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T10:00:00.000Z`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
};

const normalizeCalendarResponse = (
  raw: string,
  postingFrequency: string | null | undefined
): GeneratedCalendarEntry[] => {
  const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;

  return parsed
    .filter((entry) => typeof entry.topic === "string" && typeof entry.caption === "string")
    .map((entry, index) => {
      const fallbackDate = deriveScheduleDate(index, postingFrequency);
      const dateValue =
        typeof entry.scheduledAt === "string"
          ? entry.scheduledAt
          : typeof entry.date === "string"
            ? entry.date
            : undefined;

      return {
        date: typeof entry.date === "string" ? entry.date : undefined,
        topic: String(entry.topic).trim(),
        caption: String(entry.caption).trim(),
        platforms: normalizePlatforms(entry.platforms ?? entry.platform),
        scheduledAt: parseScheduledAt(dateValue, fallbackDate),
      };
    })
    .filter((entry) => Boolean(entry.topic) && Boolean(entry.caption));
};

const notifyCalendarFailure = async (brandId: string, error: unknown) => {
  try {
    const brand = await prisma.brandProfile.findUnique({
      where: { id: brandId },
      include: {
        user: true,
      },
    });

    if (!brand) {
      return;
    }

    const userPhone = brand.user.email.endsWith("@brandqoai.local")
      ? brand.user.email.replace("@brandqoai.local", "")
      : null;

    if (userPhone) {
      await sendWhatsAppTextMessage({
        to: userPhone,
        body: [
          `Heads up — I couldn't finish generating your 30-day content calendar for ${brand.brandName}.`,
          "",
          "I retried 3 times and it still failed. Please try again shortly.",
        ].join("\n"),
      });
    }

    console.error(
      `[ADMIN ALERT] Calendar generation failed for brand ${brand.id} (${brand.brandName}) after 3 attempts:`,
      error
    );
  } catch (notificationError) {
    console.error("Failed to send calendar failure notifications:", notificationError);
  }
};

export const generateTestContentForBrand = async (
  params: GenerateContentParams
): Promise<GeneratedPostTemplate[]> => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: params.brandId },
    include: {
      preferences: true,
    },
  });

  if (!brand) {
    return [];
  }

  const brandContext = buildBrandContext(brand);

  try {
    const provider = createProvider();

    const captionPrompt = `You are a social media copywriter for a creator. Generate 2 different Instagram captions based on the following:

${brandContext}

Topic/Request: ${params.userPrompt}

Generate exactly 2 captions. Separate them with "---". Each caption should be engaging, authentic to the brand, and end with a call-to-action or relevant emoji. Keep each under 150 characters for the hook.`;

    const captionsText = await provider.generateCaption(brandContext, captionPrompt);
    const captions = captionsText.split("---").map((c) => c.trim());

    const ideas: GeneratedPostTemplate[] = [];

    for (const caption of captions) {
      if (caption) {
        const imagePromptText = await provider.generateImagePrompt(caption, brandContext);

        ideas.push({
          caption,
          imagePrompt: imagePromptText,
        });
      }
    }

    if (ideas.length > 0) {
      await prisma.contentIdea.create({
        data: {
          brandId: brand.id,
          title: `Generated ideas for: ${params.userPrompt}`,
          description: brandContext.slice(0, 500),
          postTemplates: {
            create: ideas.map((idea) => ({
              platform: "INSTAGRAM",
              caption: idea.caption,
              imagePrompt: idea.imagePrompt,
              status: "DRAFT",
              brand: { connect: { id: brand.id } },
            })),
          },
        },
      });
    }

    return ideas;
  } catch (error) {
    console.error("Content generation failed:", error);
    return [];
  }
};

export const generateMonthlyCalendarForBrand = async (brandId: string): Promise<CalendarGenerationResult> => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandId },
    include: {
      preferences: true,
      user: true,
    },
  });

  if (!brand || !brand.preferences) {
    throw new Error("Brand preferences are required before generating a content calendar");
  }

  const brandContext = buildBrandContext(brand);
  const postsNeeded = getPostsPer30Days(brand.preferences.postingFrequency);
  const provider = createProvider();

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const prompt = `You are creating a 30-day social media content calendar.

${brandContext}
Posting frequency: ${brand.preferences.postingFrequency ?? "weekly"}
Posts needed across the next 30 days: ${postsNeeded}
Timezone: ${brand.user.timezone ?? "UTC"}

Return ONLY valid JSON as an array. Each item must contain:
- topic
- caption
- platforms (array containing one or more of INSTAGRAM, FACEBOOK, TWITTER)
- scheduledAt (ISO datetime) OR date (YYYY-MM-DD)

Rules:
- create exactly ${postsNeeded} items
- spread posts naturally across the next 30 days
- make captions beginner-friendly and brand-aware
- keep captions under 2200 characters
- prefer INSTAGRAM unless another platform clearly fits
- do not include markdown fences or commentary`;

      const raw = await provider.generateCaption(brandContext, prompt);
      const entries = normalizeCalendarResponse(raw, brand.preferences.postingFrequency).slice(0, postsNeeded);

      if (entries.length !== postsNeeded) {
        throw new Error(`Calendar generation returned ${entries.length} entries instead of ${postsNeeded}`);
      }

      await prisma.$transaction(async (tx) => {
        await tx.scheduledPost.deleteMany({
          where: { postTemplate: { brandId: brand.id } },
        });

        await tx.postTemplate.deleteMany({
          where: { brandId: brand.id },
        });

        await tx.contentIdea.deleteMany({
          where: { brandId: brand.id },
        });
      });

      const created: Array<{
        scheduledDate: string;
        topic: string;
        platforms: Array<"INSTAGRAM" | "FACEBOOK" | "TWITTER">;
        postTemplateIds: string[];
      }> = [];

      for (const entry of entries) {
        const imagePrompt = await provider.generateImagePrompt(entry.topic, brandContext);

        const createdIdea = await prisma.contentIdea.create({
          data: {
            brandId: brand.id,
            title: entry.topic,
            description: `Auto-generated 30-day calendar entry for ${entry.scheduledAt.toISOString().slice(0, 10)}`,
            status: "APPROVED",
            generatedBy: "AI",
            postTemplates: {
              create: entry.platforms.map((platform) => ({
                brandId: brand.id,
                platform,
                caption: entry.caption,
                imagePrompt,
                status: "SCHEDULED",
                scheduledPosts: {
                  create: {
                    platform,
                    scheduledTime: entry.scheduledAt,
                    status: "PENDING",
                  },
                },
              })),
            },
          },
          include: {
            postTemplates: true,
          },
        });

        created.push({
          scheduledDate: entry.scheduledAt.toISOString(),
          topic: entry.topic,
          platforms: entry.platforms,
          postTemplateIds: createdIdea.postTemplates.map((template) => template.id),
        });
      }

      return {
        attempt,
        count: created.length,
        entries: created,
      };
    } catch (error) {
      lastError = error;
      console.error(`Calendar generation attempt ${attempt} failed:`, error);
    }
  }

  await notifyCalendarFailure(brandId, lastError);
  throw lastError instanceof Error ? lastError : new Error("Calendar generation failed after 3 attempts");
};
