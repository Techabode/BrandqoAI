import { env } from "../../config/env";
import type {
  AIModelPreference,
  AIProviderName,
  ContentGenerationRequest,
  GeneratedContentItem,
} from "./aiTypes";
import { imageProviders, textProviders } from "./providers";

const providerNames: AIProviderName[] = ["claude", "mistral", "replicate", "fallback"];

const parseProviderName = (value?: string): AIProviderName | undefined => {
  if (!value) return undefined;
  return providerNames.includes(value as AIProviderName)
    ? (value as AIProviderName)
    : undefined;
};

const selectTextPreference = (
  preference?: AIModelPreference
): AIModelPreference => {
  return {
    provider: preference?.provider ?? parseProviderName(env.aiProvider),
    model: preference?.model ?? env.contentTextModel,
  };
};

const selectImagePreference = (
  preference?: AIModelPreference
): AIModelPreference => {
  return {
    provider: preference?.provider ?? "replicate",
    model: preference?.model ?? env.contentImageModel,
  };
};

const withGeneratedImages = async (
  items: GeneratedContentItem[],
  request: ContentGenerationRequest
) => {
  if (!request.image.required || !request.image.generationEnabled) return items;

  const preference = selectImagePreference(request.image.preference);
  const provider = imageProviders.find((candidate) =>
    candidate.canGenerateImage(preference)
  );

  if (!provider) return items;

  const hydratedItems = await Promise.all(
    items.map(async (item) => {
      if (!item.imagePrompt) return item;

      const imageUrl = await provider.generateImage(item.imagePrompt, preference);
      return imageUrl ? { ...item, imageUrl } : item;
    })
  );

  return hydratedItems;
};

export const generateContentWithAI = async (
  request: ContentGenerationRequest
): Promise<GeneratedContentItem[]> => {
  const textPreference = selectTextPreference(request.textPreference);
  const textRequest = {
    ...request,
    textPreference,
    image: {
      ...request.image,
      preference: selectImagePreference(request.image.preference),
    },
  };

  for (const provider of textProviders) {
    if (!provider.canGenerateText(textPreference)) continue;

    try {
      const items = await provider.generateContent(textRequest);
      if (items.length > 0) {
        return withGeneratedImages(items, textRequest);
      }
    } catch {
      continue;
    }
  }

  return [];
};
