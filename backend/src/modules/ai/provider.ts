import { env } from "../../config/env";
import * as claude from "./claude";
import * as mistral from "./mistral";

export interface AIProvider {
    generateCaption(brandContext: string, userPrompt: string): Promise<string>;
    generateImagePrompt(caption: string, brandContext: string): Promise<string>;
}

export const createProvider = (): AIProvider => {
    if (env.aiProvider === "claude") {
        return claude;
    } else if (env.aiProvider === "mistral") {
        return mistral;
    } else {
        throw new Error(`Unknown AI provider: ${env.aiProvider}`);
    }
};
