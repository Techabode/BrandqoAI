import type { ContentGenerationRequest } from "./aiTypes";

const formatBrandLine = (label: string, value?: string | null) => {
  return value ? `- ${label}: ${value}` : null;
};

export const buildContentPrompt = (request: ContentGenerationRequest) => {
  const { brand } = request;
  const count = request.count ?? 3;
  const platform = request.platform ?? "INSTAGRAM";

  const brandLines = [
    formatBrandLine("Brand", brand.brandName),
    formatBrandLine("Industry", brand.industry),
    formatBrandLine("Target audience", brand.targetAudience),
    formatBrandLine("Tone of voice", brand.toneOfVoice),
    formatBrandLine("Keywords", brand.keywords),
    formatBrandLine("Content pillars", brand.contentPillars),
    formatBrandLine("Posting frequency", brand.postingFrequency),
    formatBrandLine("Banned topics", brand.bannedTopics),
    formatBrandLine("Languages", brand.languages),
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "You are BrandqoAI, a senior social media strategist for creators and small businesses.",
    "Generate practical, on-brand social content that can be saved as draft post templates.",
    "",
    "Brand context:",
    brandLines,
    "",
    `User request: ${request.userPrompt}`,
    `Primary platform: ${platform}`,
    `Number of content options: ${count}`,
    `Image needed: ${request.image.required ? "yes" : "no"}`,
    "",
    "Return only valid JSON. Do not include markdown fences.",
    "Use this exact shape:",
    JSON.stringify(
      {
        ideas: [
          {
            title: "Short internal title",
            platform,
            contentGoal: "Awareness, engagement, launch, education, retention, or sales",
            caption: "Ready-to-post caption with line breaks, concrete value, and a CTA",
            callToAction: "Clear action for the audience",
            imagePrompt:
              "Detailed poster/image prompt if image is needed, otherwise omit",
            hashtags: ["#example", "#brand"],
          },
        ],
      },
      null,
      2
    ),
    "",
    "Rules:",
    "- Avoid generic filler and placeholder phrases.",
    "- Make each idea meaningfully different.",
    "- Keep captions useful to the brand's target audience.",
    "- If an image is needed, write an art-direction prompt a designer or image model can use.",
    "- Respect banned topics and language preferences when provided.",
  ].join("\n");
};
