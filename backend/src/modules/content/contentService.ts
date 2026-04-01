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

interface PostingFrequencySettings {
  postingDaysPerWeek: number;
  postsPerDay: number;
}

const getPostsPer30Days = (settings: PostingFrequencySettings): number => {
  const weeksIn30Days = 30 / 7;
  return Math.round(settings.postingDaysPerWeek * settings.postsPerDay * weeksIn30Days);
};

const getDaySpacing = (settings: PostingFrequencySettings): number => {
  return Math.max(1, Math.floor(7 / settings.postingDaysPerWeek));
};

const deriveScheduleDate = (index: number, settings: PostingFrequencySettings): Date => {
  const date = new Date();
  date.setUTCHours(10, 0, 0, 0);
  const postsPerDay = settings.postsPerDay;
  const dayIndex = Math.floor(index / postsPerDay);
  date.setUTCDate(date.getUTCDate() + dayIndex * getDaySpacing(settings));
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

const extractJsonPayload = (raw: string): unknown => {
  const trimmed = raw.trim();

  const tryParse = (value: string): unknown | null => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  };

  if (trimmed.startsWith("```")) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      const parsed = tryParse(fenced[1].trim());
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  for (let start = 0; start < trimmed.length; start++) {
    if (trimmed[start] !== "[" && trimmed[start] !== "{") {
      continue;
    }

    for (let end = trimmed.length - 1; end > start; end--) {
      const candidate = trimmed.slice(start, end + 1);
      const parsed = tryParse(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  throw new Error(`Model did not return parseable JSON: ${trimmed.slice(0, 200)}`);
};

const extractStructuredCalendarPayload = (raw: string): Array<Record<string, unknown>> => {
  const parsed = extractJsonPayload(raw);
  if (Array.isArray(parsed)) {
    return parsed as Array<Record<string, unknown>>;
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    "entries" in parsed &&
    Array.isArray((parsed as { entries?: unknown }).entries)
  ) {
    return (parsed as { entries: Array<Record<string, unknown>> }).entries;
  }

  throw new Error(`Model did not return a calendar array payload`);
};

const normalizeCalendarResponse = (
  raw: string,
  frequencySettings: PostingFrequencySettings
): GeneratedCalendarEntry[] => {
  const parsed = extractStructuredCalendarPayload(raw);

  return parsed
    .filter((entry) => typeof entry.topic === "string" && typeof entry.caption === "string")
    .map((entry, index) => {
      const fallbackDate = deriveScheduleDate(index, frequencySettings);
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

    const captionPrompt = `Generate exactly 2 Instagram caption options for this brand and topic.

${brandContext}

Topic/Request: ${params.userPrompt}

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON.
- Do NOT include prose, explanations, markdown, bullets, numbering, headings, or code fences.
- Start with [ and end with ].
- Return exactly 2 objects.
- Each object must have only one field: "caption".
- Each caption should be engaging, authentic to the brand, and end with a call-to-action or relevant emoji.`;

    const captionsText = provider.generateJson
      ? await provider.generateJson(captionPrompt, { maxRetries: 4 })
      : await provider.generateCaption(brandContext, captionPrompt);
    const parsedCaptions = extractJsonPayload(captionsText);
    const captions = Array.isArray(parsedCaptions)
      ? (parsedCaptions as Array<Record<string, unknown>>)
          .map((item) => (typeof item.caption === "string" ? item.caption.trim() : ""))
          .filter(Boolean)
          .slice(0, 2)
      : [];

    const ideas: GeneratedPostTemplate[] = [];

    for (const caption of captions) {
      if (caption) {
        const imagePromptText = await provider.generateImagePrompt(brandContext, caption);

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
  const frequencySettings: PostingFrequencySettings = {
    postingDaysPerWeek: brand.preferences.postingDaysPerWeek ?? 1,
    postsPerDay: brand.preferences.postsPerDay ?? 1,
  };
  const postsNeeded = getPostsPer30Days(frequencySettings);
  const provider = createProvider();

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const prompt = `You are creating a 30-day social media content calendar.

${brandContext}
Posting schedule: ${frequencySettings.postingDaysPerWeek} days per week, ${frequencySettings.postsPerDay} posts per posting day
Posts needed across the next 30 days: ${postsNeeded}
Timezone: ${brand.user.timezone ?? "UTC"}

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON.
- Do NOT include any prose, preface, explanation, markdown, code fences, or labels.
- Start the first character with [ and end the final character with ].
- The response must be a JSON array with exactly ${postsNeeded} objects.

Each object must contain:
- topic
- caption
- platforms (array containing one or more of INSTAGRAM, FACEBOOK, TWITTER)
- scheduledAt (ISO datetime) OR date (YYYY-MM-DD)

Example format:
[
  {
    "topic": "Behind the scenes of building Oracus",
    "caption": "A quick look behind the scenes as we build smarter workflows for creators.",
    "platforms": ["INSTAGRAM"],
    "date": "2026-03-28"
  }
]

Rules:
- create exactly ${postsNeeded} items
- spread posts naturally across the next 30 days
- make captions beginner-friendly and brand-aware
- keep captions under 2200 characters
- prefer INSTAGRAM unless another platform clearly fits`;

      const raw = provider.generateJson
        ? await provider.generateJson(prompt, { maxRetries: 4 })
        : await provider.generateCaption(brandContext, prompt);
      const entries = normalizeCalendarResponse(raw, frequencySettings).slice(0, postsNeeded);

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
