import "dotenv/config";

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: getEnv("DATABASE_URL"),
  jwtSecret: getEnv("JWT_SECRET"),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  aiProvider: process.env.AI_PROVIDER ?? "fallback",
  contentTextModel: process.env.CONTENT_TEXT_MODEL,
  contentImageModel: process.env.CONTENT_IMAGE_MODEL,
  enableImageGeneration: process.env.ENABLE_IMAGE_GENERATION === "true",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  togetherApiKey: process.env.TOGETHER_API_KEY,
  togetherTextModel:
    process.env.TOGETHER_TEXT_MODEL ?? "mistralai/Mixtral-8x7B-Instruct-v0.1",
  replicateApiKey: process.env.REPLICATE_API_KEY,
};
