import "dotenv/config";

type AIProvider = "mistral" | "claude";
type NodeEnv = "development" | "production" | "test";

const envSource: NodeJS.ProcessEnv = process.env;

const requireEnv = (key: string): string => {
  const value: string | undefined = envSource[key];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const optionalEnv = (key: string, fallback?: string): string | undefined => {
  const value: string | undefined = envSource[key];
  return value ?? fallback;
};

const parseNumber = (key: string, fallback: number): number => {
  const raw: string | undefined = envSource[key];

  if (!raw) return fallback;

  const parsed: number = Number(raw);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for env ${key}`);
  }

  return parsed;
};

const parseNodeEnv = (): NodeEnv => {
  const value = optionalEnv("NODE_ENV", "development");

  if (value === "development" || value === "production" || value === "test") {
    return value;
  }

  throw new Error(`Invalid NODE_ENV: ${value}`);
};

const parseAIProvider = (): AIProvider => {
  const value = optionalEnv("AI_PROVIDER", "mistral");

  if (value === "mistral" || value === "claude") {
    return value;
  }

  throw new Error(`Invalid AI_PROVIDER: ${value}`);
};

const aiProvider: AIProvider = parseAIProvider();

const providerKey = (
  key: string,
  expectedProvider: AIProvider
): string | undefined => {
  const value: string | undefined = envSource[key];

  if (aiProvider === expectedProvider && (!value || value.trim() === "")) {
    throw new Error(
      `Missing required environment variable ${key} for provider ${expectedProvider}`
    );
  }

  return value;
};

const whatsapp = {
  verifyToken: optionalEnv("WHATSAPP_VERIFY_TOKEN"),
  phoneNumberId: optionalEnv("WHATSAPP_PHONE_NUMBER_ID"),
  accessToken: optionalEnv("WHATSAPP_ACCESS_TOKEN"),
};

export const env = Object.freeze({
  nodeEnv: parseNodeEnv(),
  port: parseNumber("PORT", 4000),

  appUrl: optionalEnv("APP_URL"),
  backendPublicUrl: optionalEnv("BACKEND_PUBLIC_URL"),

  magicLinkSecret: optionalEnv("MAGIC_LINK_SECRET") ?? requireEnv("JWT_SECRET"),

  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),

  corsOrigin: optionalEnv("CORS_ORIGIN", "*"),

  aiProvider,

  whatsapp,
  whatsappVerifyToken: whatsapp.verifyToken,
  whatsappPhoneNumberId: whatsapp.phoneNumberId,
  whatsappAccessToken: whatsapp.accessToken,

  anthropic: {
    apiKey: providerKey("ANTHROPIC_API_KEY", "claude"),
    model: optionalEnv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
  },

  mistral: {
    apiKey: providerKey("TOGETHER_API_KEY", "mistral"),
  },

  replicateApiKey: optionalEnv("REPLICATE_API_KEY"),

  meta: {
    appId: optionalEnv("META_APP_ID"),
    appSecret: optionalEnv("META_APP_SECRET"),
    redirectUri: optionalEnv("META_REDIRECT_URI"),
    graphApiVersion: optionalEnv("META_GRAPH_API_VERSION", "v22.0"),
  },

  socialOAuthStateSecret:
    optionalEnv("SOCIAL_OAUTH_STATE_SECRET") ?? requireEnv("JWT_SECRET"),
});
