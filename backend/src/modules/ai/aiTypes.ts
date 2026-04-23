export type AIProviderName = "claude" | "mistral" | "replicate" | "fallback";

export type AITaskType = "content" | "image";

export interface AIModelPreference {
  provider?: AIProviderName;
  model?: string;
}

export interface BrandGenerationContext {
  brandName: string;
  industry?: string | null;
  targetAudience?: string | null;
  toneOfVoice?: string | null;
  keywords?: string | null;
  contentPillars?: string | null;
  postingFrequency?: string | null;
  bannedTopics?: string | null;
  languages?: string | null;
}

export interface ContentGenerationRequest {
  brand: BrandGenerationContext;
  userPrompt: string;
  platform?: "INSTAGRAM" | "FACEBOOK" | "TWITTER";
  count?: number;
  image: {
    required: boolean;
    generationEnabled: boolean;
    preference?: AIModelPreference;
  };
  textPreference?: AIModelPreference;
}

export interface GeneratedContentItem {
  title: string;
  caption: string;
  imagePrompt?: string;
  imageUrl?: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "TWITTER";
  contentGoal?: string;
  callToAction?: string;
  hashtags?: string[];
}

export interface AITextProvider {
  name: AIProviderName;
  canGenerateText(preference?: AIModelPreference): boolean;
  generateContent(request: ContentGenerationRequest): Promise<GeneratedContentItem[]>;
}

export interface AIImageProvider {
  name: AIProviderName;
  canGenerateImage(preference?: AIModelPreference): boolean;
  generateImage(prompt: string, preference?: AIModelPreference): Promise<string | undefined>;
}
