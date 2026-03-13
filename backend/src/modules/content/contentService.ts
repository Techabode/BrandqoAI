import { prisma } from "../../db/client";
import { createProvider } from "../ai/provider";

interface GenerateContentParams {
  brandId: string;
  userPrompt: string;
}

interface GeneratedPostTemplate {
  caption: string;
  imagePrompt: string;
}

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

  const brandContext = [
    `Brand name: ${brand.brandName}`,
    brand.industry ? `Industry: ${brand.industry}` : null,
    brand.targetAudience ? `Target audience: ${brand.targetAudience}` : null,
    brand.toneOfVoice ? `Tone of voice: ${brand.toneOfVoice}` : null,
    brand.contentPillars ? `Content pillars: ${brand.contentPillars}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Generate content using configured AI provider (Mistral or Claude)
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
        const imagePromptText = await provider.generateImagePrompt(
          caption,
          brandContext
        );

        ideas.push({
          caption: caption,
          imagePrompt: imagePromptText,
        });
      }
    }

    // Store in database
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
    // eslint-disable-next-line no-console
    console.error("Content generation failed:", error);
    // Return empty array on error; in production you might want to retry or show user-friendly message
    return [];
  }
};

