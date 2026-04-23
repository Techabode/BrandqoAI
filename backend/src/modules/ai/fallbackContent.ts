import type {
  ContentGenerationRequest,
  GeneratedContentItem,
} from "./aiTypes";

const titleFromPrompt = (prompt: string) => {
  const trimmed = prompt.trim();
  if (trimmed.length <= 56) return trimmed;
  return `${trimmed.slice(0, 53)}...`;
};

export const generateFallbackContent = (
  request: ContentGenerationRequest
): GeneratedContentItem[] => {
  const { brand, userPrompt } = request;
  const platform = request.platform ?? "INSTAGRAM";
  const audience = brand.targetAudience ?? "your audience";
  const tone = brand.toneOfVoice ?? "clear, helpful, and confident";
  const industry = brand.industry ?? "your niche";
  const title = titleFromPrompt(userPrompt);

  return [
    {
      title: `${title} - value post`,
      platform,
      contentGoal: "education",
      caption: [
        `${brand.brandName} tip: ${userPrompt}`,
        "",
        `If you serve ${audience}, focus on one useful takeaway your audience can apply today. Keep the message ${tone}, show why it matters in ${industry}, and end with a simple next step.`,
        "",
        "What would you like to improve first?",
      ].join("\n"),
      callToAction: "Ask the audience to reply with their biggest challenge.",
      imagePrompt: request.image.required
        ? `Create a clean social poster for ${brand.brandName}. Theme: ${userPrompt}. Audience: ${audience}. Tone: ${tone}. Use bold typography, one clear focal message, and platform-ready composition.`
        : undefined,
      hashtags: ["#BrandqoAI", "#ContentStrategy", "#SmallBusiness"],
    },
    {
      title: `${title} - story post`,
      platform,
      contentGoal: "engagement",
      caption: [
        `Behind the scenes at ${brand.brandName}: ${userPrompt}`,
        "",
        `Share the real story, the decision behind it, and the lesson your audience can take away. Make it specific enough to feel human and useful enough to save.`,
        "",
        "Save this if it helps you plan your next move.",
      ].join("\n"),
      callToAction: "Invite saves or replies.",
      imagePrompt: request.image.required
        ? `Design a warm behind-the-scenes visual for ${brand.brandName} about ${userPrompt}. Show creative process, practical details, and an authentic brand moment.`
        : undefined,
      hashtags: ["#BehindTheScenes", "#CreatorBusiness", "#BrandBuilding"],
    },
  ];
};
