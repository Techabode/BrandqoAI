import Replicate from "replicate";
import { env } from "../../config/env";

const replicate = new Replicate({
    auth: env.replicateApiKey,
});

export const generateImage = async (prompt: string): Promise<string> => {
    const output = await replicate.run(
        "stability-ai/stable-diffusion-3:09ac262505fe87da5c4253a57d7da22abbf51ce750afef7a34df73e6da0bad51",
        {
            input: {
                prompt,
                num_inference_steps: 28,
                guidance_scale: 7.5,
            },
        }
    );

    if (!output || !Array.isArray(output) || output.length === 0) {
        throw new Error("Failed to generate image");
    }

    return output[0] as string;
};
