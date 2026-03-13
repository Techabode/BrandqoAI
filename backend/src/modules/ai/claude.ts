import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";

const client = new Anthropic({
    apiKey: env.anthropicApiKey,
});

export const generateCaption = async (prompt: string): Promise<string> => {
    const message = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
    }

    return textContent.text;
};

export const generateImagePrompt = async (
    brandContext: string,
    contentTopic: string
): Promise<string> => {
    const prompt = `You are a creative director for social media content. Given the brand context and topic, generate a detailed, vivid image prompt that would work well for Stable Diffusion. The prompt should be specific, visual, and evoke the brand's tone.

Brand Context:
${brandContext}

Topic:
${contentTopic}

Generate only the image prompt, nothing else. Make it detailed and specific for a text-to-image AI.`;

    return generateCaption(prompt);
};
