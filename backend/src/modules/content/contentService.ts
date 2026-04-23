import { env } from "../../config/env";
import { prisma } from "../../db/client";
import { generateContentWithAI } from "../ai/aiService";
import type {
  AIModelPreference,
  ContentGenerationRequest,
  GeneratedContentItem,
} from "../ai/aiTypes";

interface GenerateContentParams {
  brandId: string;
  userPrompt: string;
  platform?: "INSTAGRAM" | "FACEBOOK" | "TWITTER";
  count?: number;
  textModel?: AIModelPreference;
  imageModel?: AIModelPreference;
}

interface GeneratedPostTemplate {
  caption: string;
  imagePrompt?: string;
  imageUrl?: string;
}

interface BrandWithPreferences {
  id: string;
  brandName: string;
  industry: string | null;
  targetAudience: string | null;
  toneOfVoice: string | null;
  keywords: string | null;
  contentPillars: string | null;
  preferences: {
    postingFrequency: string | null;
    bannedTopics: string | null;
    languages: string | null;
  } | null;
}

const imageIntentPattern =
  /\b(image|poster|flyer|design|creative|visual|graphic|banner|ad|carousel)\b/i;
const textOnlyPattern = /\b(text only|caption only|no image|without image)\b/i;

const requiresImage = (prompt: string) => {
  if (textOnlyPattern.test(prompt)) return false;
  if (imageIntentPattern.test(prompt)) return true;

  // BrandqoAI's current product flow creates post templates with poster prompts.
  return true;
};

const appendHashtags = (caption: string, hashtags?: string[]) => {
  if (!hashtags?.length) return caption;

  const tags = hashtags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

  if (!tags.length) return caption;
  if (tags.some((tag) => caption.includes(tag))) return caption;

  return `${caption}\n\n${tags.join(" ")}`;
};

const toContentRequest = (
  brand: BrandWithPreferences | null,
  params: GenerateContentParams
): ContentGenerationRequest | null => {
  if (!brand) return null;

  return {
    brand: {
      brandName: brand.brandName,
      industry: brand.industry,
      targetAudience: brand.targetAudience,
      toneOfVoice: brand.toneOfVoice,
      keywords: brand.keywords,
      contentPillars: brand.contentPillars,
      postingFrequency: brand.preferences?.postingFrequency,
      bannedTopics: brand.preferences?.bannedTopics,
      languages: brand.preferences?.languages,
    },
    userPrompt: params.userPrompt,
    platform: params.platform ?? "INSTAGRAM",
    count: params.count ?? 3,
    image: {
      required: requiresImage(params.userPrompt),
      generationEnabled:
        env.enableImageGeneration ||
        Boolean(params.imageModel?.model || env.contentImageModel),
      preference: params.imageModel,
    },
    textPreference: params.textModel,
  };
};

const toPostTemplates = (items: GeneratedContentItem[]): GeneratedPostTemplate[] => {
  return items.map((item) => ({
    caption: appendHashtags(item.caption, item.hashtags),
    imagePrompt: item.imagePrompt,
    imageUrl: item.imageUrl,
  }));
};

export const generateContentForBrand = async (
  params: GenerateContentParams
): Promise<GeneratedPostTemplate[]> => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: params.brandId },
    include: {
      preferences: true,
    },
  });

  const request = toContentRequest(brand, params);
  if (!request || !brand) {
    return [];
  }

  const items = await generateContentWithAI(request);
  if (!items.length) {
    return [];
  }

  const ideas = toPostTemplates(items);
  const description = [
    `Prompt: ${params.userPrompt}`,
    `Provider: ${request.textPreference?.provider ?? env.aiProvider}`,
    `Text model: ${request.textPreference?.model ?? env.contentTextModel ?? "default"}`,
    request.image.generationEnabled
      ? `Image model: ${request.image.preference?.model ?? env.contentImageModel ?? "default"}`
      : "Image generation: disabled",
  ].join("\n");

  await prisma.contentIdea.create({
    data: {
      brandId: brand.id,
      title: `Generated content for: ${params.userPrompt}`,
      description: description.slice(0, 500),
      postTemplates: {
        create: items.map((item) => ({
          platform: item.platform,
          caption: appendHashtags(item.caption, item.hashtags),
          imagePrompt: item.imagePrompt,
          imageUrl: item.imageUrl,
          status: "DRAFT",
          brand: { connect: { id: brand.id } },
        })),
      },
    },
  });

  return ideas;
};

export const generateTestContentForBrand = generateContentForBrand;
