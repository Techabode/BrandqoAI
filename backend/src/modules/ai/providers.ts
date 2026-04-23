import { env } from "../../config/env";
import { buildContentPrompt } from "./contentPrompt";
import { generateFallbackContent } from "./fallbackContent";
import type {
  AIImageProvider,
  AIModelPreference,
  AIProviderName,
  AITextProvider,
  ContentGenerationRequest,
  GeneratedContentItem,
} from "./aiTypes";
import { parseJsonFromText } from "./jsonResponse";

interface ModelResponse {
  ideas?: unknown;
}

const isProviderPreference = (
  preference: AIModelPreference | undefined,
  provider: AIProviderName
) => {
  return !preference?.provider || preference.provider === provider;
};

const normalizeGeneratedItems = (
  response: ModelResponse | null,
  request: ContentGenerationRequest
): GeneratedContentItem[] => {
  if (!Array.isArray(response?.ideas)) return [];

  return response.ideas
    .map((item): GeneratedContentItem | null => {
      if (!item || typeof item !== "object") return null;

      const value = item as Record<string, unknown>;
      const caption = typeof value.caption === "string" ? value.caption.trim() : "";
      if (!caption) return null;

      let platform: "INSTAGRAM" | "FACEBOOK" | "TWITTER" =
        request.platform ?? "INSTAGRAM";

      if (
        value.platform === "INSTAGRAM" ||
        value.platform === "FACEBOOK" ||
        value.platform === "TWITTER"
      ) {
        platform = value.platform;
      }

      const hashtags = Array.isArray(value.hashtags)
        ? value.hashtags.filter((tag): tag is string => typeof tag === "string")
        : undefined;

      return {
        title:
          typeof value.title === "string" && value.title.trim()
            ? value.title.trim()
            : `Content idea for ${request.brand.brandName}`,
        platform,
        contentGoal:
          typeof value.contentGoal === "string" ? value.contentGoal.trim() : undefined,
        caption,
        callToAction:
          typeof value.callToAction === "string"
            ? value.callToAction.trim()
            : undefined,
        imagePrompt:
          typeof value.imagePrompt === "string" && value.imagePrompt.trim()
            ? value.imagePrompt.trim()
            : undefined,
        hashtags,
      };
    })
    .filter((item): item is GeneratedContentItem => Boolean(item));
};

class FallbackProvider implements AITextProvider {
  name: AIProviderName = "fallback";

  canGenerateText() {
    return true;
  }

  async generateContent(request: ContentGenerationRequest) {
    return generateFallbackContent(request);
  }
}

class ClaudeProvider implements AITextProvider {
  name: AIProviderName = "claude";

  canGenerateText(preference?: AIModelPreference) {
    return Boolean(env.anthropicApiKey) && isProviderPreference(preference, this.name);
  }

  async generateContent(request: ContentGenerationRequest) {
    const prompt = buildContentPrompt(request);
    const model = request.textPreference?.model ?? env.contentTextModel ?? env.anthropicModel;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.anthropicApiKey ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = payload.content?.find((item) => item.type === "text")?.text;
    if (!text) return [];

    return normalizeGeneratedItems(parseJsonFromText<ModelResponse>(text), request);
  }
}

class MistralProvider implements AITextProvider {
  name: AIProviderName = "mistral";

  canGenerateText(preference?: AIModelPreference) {
    return Boolean(env.togetherApiKey) && isProviderPreference(preference, this.name);
  }

  async generateContent(request: ContentGenerationRequest) {
    const prompt = buildContentPrompt(request);
    const model =
      request.textPreference?.model ?? env.contentTextModel ?? env.togetherTextModel;

    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.togetherApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You generate valid JSON social content plans for BrandqoAI.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) return [];

    return normalizeGeneratedItems(parseJsonFromText<ModelResponse>(text), request);
  }
}

class ReplicateImageProvider implements AIImageProvider {
  name: AIProviderName = "replicate";

  canGenerateImage(preference?: AIModelPreference) {
    return (
      Boolean(env.replicateApiKey && (preference?.model || env.contentImageModel)) &&
      isProviderPreference(preference, this.name)
    );
  }

  async generateImage(prompt: string, preference?: AIModelPreference) {
    const model = preference?.model ?? env.contentImageModel;
    if (!model) return undefined;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${env.replicateApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: model,
        input: { prompt },
      }),
    });

    if (!response.ok) return undefined;

    const payload = (await response.json()) as {
      output?: string | string[];
    };

    if (typeof payload.output === "string") return payload.output;
    if (Array.isArray(payload.output) && typeof payload.output[0] === "string") {
      return payload.output[0];
    }

    return undefined;
  }
}

export const textProviders: AITextProvider[] = [
  new ClaudeProvider(),
  new MistralProvider(),
  new FallbackProvider(),
];

export const imageProviders: AIImageProvider[] = [new ReplicateImageProvider()];
