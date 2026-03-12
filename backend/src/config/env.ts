import "dotenv/config";

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
};

const aiProvider = (process.env.AI_PROVIDER ?? "mistral") as "mistral" | "claude";

const getApiKey = (key: string, provider: string, expectedProvider: string): string | undefined => {
  if (provider === expectedProvider) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable ${key} for provider ${provider}`);
    }
    return value;
  }
  return process.env[key];
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: getEnv("DATABASE_URL"),
  jwtSecret: getEnv("JWT_SECRET"),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  aiProvider,
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  anthropicApiKey: getApiKey("ANTHROPIC_API_KEY", aiProvider, "claude"),
  replicateApiKey: process.env.REPLICATE_API_KEY,
  togetherApiKey: getApiKey("TOGETHER_API_KEY", aiProvider, "mistral") as string,
};

