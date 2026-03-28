import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";

const client = new Anthropic({
  apiKey: env.anthropicApiKey,
});

const BASE_SYSTEM_PROMPT = "You are an API generation engine inside BrandqoAI. Return concise outputs that follow the requested format exactly. Do not add introductions, explanations, markdown, bullet lists, or commentary unless explicitly requested.";

const extractText = (message: { content: Array<{ type: string; text?: string }> }): string => {
  const textContent = message.content.find((block: { type: string; text?: string }) => block.type === "text");
  if (!textContent || textContent.type !== "text" || !textContent.text) {
    throw new Error("No text response from Claude");
  }

  return textContent.text.trim();
};

const createMessage = async (prompt: string, system = BASE_SYSTEM_PROMPT): Promise<string> => {
  const message = await client.messages.create({
    model: env.anthropicModel,
    max_tokens: 1024,
    temperature: 0.2,
    system,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return extractText(message);
};

const tryExtractJsonSubstring = (raw: string): string | null => {
  const trimmed = raw.trim();

  if (trimmed.startsWith("```")) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      return fenced[1].trim();
    }
  }

  for (let start = 0; start < trimmed.length; start++) {
    if (trimmed[start] !== "[" && trimmed[start] !== "{") {
      continue;
    }

    for (let end = trimmed.length - 1; end > start; end--) {
      const candidate = trimmed.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // keep scanning
      }
    }
  }

  return null;
};

export const generateText = async (prompt: string): Promise<string> => {
  return createMessage(prompt);
};

export const generateJson = async (prompt: string, options?: { maxRetries?: number }): Promise<string> => {
  const maxRetries = options?.maxRetries ?? 3;
  let lastRaw = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const retryInstruction = attempt === 1
      ? ""
      : `\n\nIMPORTANT RETRY ${attempt}: Your previous response was not valid JSON. Return ONLY valid JSON. No prose. No markdown. No code fences.`;

    const raw = await createMessage(
      `${prompt}${retryInstruction}`,
      `${BASE_SYSTEM_PROMPT} When JSON is requested, output valid JSON only.`,
    );
    lastRaw = raw;

    const candidate = tryExtractJsonSubstring(raw) ?? raw.trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // retry
    }
  }

  throw new Error(`Claude did not return valid JSON after ${maxRetries} attempts: ${lastRaw.slice(0, 300)}`);
};

export const generateCaption = async (_brandContext: string, userPrompt: string): Promise<string> => {
  return generateText(userPrompt);
};

export const generateImagePrompt = async (brandContext: string, contentTopic: string): Promise<string> => {
  const prompt = `You are a creative director for social media content. Given the brand context and topic, generate a detailed, vivid image prompt that would work well for Stable Diffusion. The prompt should be specific, visual, and evoke the brand's tone.\n\nBrand Context:\n${brandContext}\n\nTopic:\n${contentTopic}\n\nGenerate only the image prompt, nothing else. Make it detailed and specific for a text-to-image AI.`;

  return generateText(prompt);
};
