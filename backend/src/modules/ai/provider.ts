import { env } from "../../config/env";
import * as claude from "./claude";
import * as mistral from "./mistral";

export interface AIProvider {
  generateCaption(brandContext: string, userPrompt: string): Promise<string>;
  generateImagePrompt(brandContext: string, contentTopic: string): Promise<string>;
  generateJson?(prompt: string, options?: { maxRetries?: number }): Promise<string>;
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
