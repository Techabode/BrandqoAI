import { env } from "../../config/env";

interface TogetherChatResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
    error?: {
        message?: string;
        code?: string;
    };
}

const TOGETHER_MODEL = "deepseek-ai/DeepSeek-V3";

export const generateCaption = async (prompt: string): Promise<string> => {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${env.togetherApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: TOGETHER_MODEL,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.9,
        }),
    });

    const data = await response.json() as TogetherChatResponse;

    if (!response.ok) {
        const details = data?.error?.message ? ` - ${data.error.message}` : "";
        throw new Error(`Together AI API error: ${response.status} ${response.statusText}${details}`);
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
        throw new Error(`No response from Together model ${TOGETHER_MODEL}`);
    }

    return content;
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
