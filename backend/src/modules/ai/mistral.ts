import { env } from "../../config/env";

interface TogetherResponse {
    choices: Array<{
        text: string;
    }>;
}

export const generateCaption = async (prompt: string): Promise<string> => {
    const response = await fetch("https://api.together.xyz/v1/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${env.togetherApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            prompt: prompt,
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50,
        }),
    });

    if (!response.ok) {
        throw new Error(`Together AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as TogetherResponse;

    if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from Mistral");
    }

    return data.choices[0].text.trim();
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
