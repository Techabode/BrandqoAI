import { prisma, Prisma } from "../../db/client";
import { env } from "../../config/env";
import { createWhatsAppMagicLinkToken } from "../auth/magicLink";
import { generateMonthlyCalendarForBrand, generateTestContentForBrand } from "../content/contentService";

type ConversationStep =
  | "WELCOME"
  | "ASK_BRAND_NAME"
  | "ASK_INDUSTRY"
  | "ASK_AUDIENCE"
  | "ASK_TONE"
  | "ASK_CONTENT_PILLARS"
  | "ASK_LOGO_URL"
  | "ASK_POSTING_DAYS"
  | "ASK_POSTS_PER_DAY"
  | "ASK_APPROVAL_MODE"
  | "WAIT_FOR_SOCIAL_CONNECTION"
  | "READY";

type ApprovalMode = "MANUAL" | "AUTO_POST";

interface HandleIncomingMessageParams {
  fromPhone: string;
  text: string;
}

interface ConversationContext {
  brandId?: string;
  postingDaysPerWeek?: number;
}

const RESET_MESSAGE = "Okay, I’ve reset our conversation. Tell me a bit about your brand to get started.";
const SKIP_VALUES = new Set(["skip", "none", "no", "n/a"]);
const RESUME_AFTER_MS = 30 * 60 * 1000;
const APPROVAL_LABELS: Record<ApprovalMode, string> = {
  MANUAL: "manual approval",
  AUTO_POST: "auto-post",
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const validateRequiredField = (
  input: string,
  fieldLabel: string,
  options: { min?: number; max?: number } = {}
): { ok: true; value: string } | { ok: false; message: string } => {
  const value = normalizeText(input);
  const min = options.min ?? 2;
  const max = options.max ?? 160;

  if (!value) {
    return { ok: false, message: `I didn’t catch that. Please send your ${fieldLabel}.` };
  }

  if (value.length < min) {
    return {
      ok: false,
      message: `Your ${fieldLabel} looks too short. Please send a bit more detail.`,
    };
  }

  if (value.length > max) {
    return {
      ok: false,
      message: `That ${fieldLabel} is a bit too long. Keep it under ${max} characters and try again.`,
    };
  }

  return { ok: true, value };
};

const normalizeCommaSeparatedList = (input: string, maxItems = 5): string[] => {
  return normalizeText(input)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
};

const validateContentPillars = (
  input: string
): { ok: true; value: string } | { ok: false; message: string } => {
  const raw = normalizeText(input);
  if (!raw) {
    return {
      ok: false,
      message:
        "Please send 2 to 5 content pillars separated by commas. Example: education, behind the scenes, testimonials.",
    };
  }

  const pillars = normalizeCommaSeparatedList(raw, 5);

  if (pillars.length < 2) {
    return {
      ok: false,
      message:
        "Please send at least 2 content pillars separated by commas. Example: education, product tips, testimonials.",
    };
  }

  if (pillars.some((pillar) => pillar.length < 2)) {
    return {
      ok: false,
      message: "One of those content pillars is too short. Please resend them clearly.",
    };
  }

  return { ok: true, value: pillars.join(", ") };
};

const validateOptionalLogoUrl = (
  input: string
): { ok: true; value: string | null } | { ok: false; message: string } => {
  const value = normalizeText(input);

  if (!value || SKIP_VALUES.has(value.toLowerCase())) {
    return { ok: true, value: null };
  }

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        ok: false,
        message: "Please send a valid http or https logo URL, or reply skip.",
      };
    }

    return { ok: true, value: url.toString() };
  } catch {
    return {
      ok: false,
      message: "That doesn’t look like a valid logo URL. Send a full link like https://example.com/logo.png or reply skip.",
    };
  }
};

const parsePostingDaysPerWeek = (input: string): number | null => {
  const normalized = normalizeText(input).toLowerCase();
  if (["1", "one", "1 day"].includes(normalized)) return 1;
  if (["2", "two", "2 days"].includes(normalized)) return 2;
  if (["3", "three", "3 days"].includes(normalized)) return 3;
  return null;
};

const parsePostsPerDay = (input: string): number | null => {
  const normalized = normalizeText(input).toLowerCase();
  if (["1", "one", "1 post"].includes(normalized)) return 1;
  if (["2", "two", "2 posts"].includes(normalized)) return 2;
  return null;
};

const parseApprovalMode = (input: string): ApprovalMode | null => {
  const normalized = normalizeText(input).toLowerCase();
  if (["1", "manual", "manual approval", "approve manually"].includes(normalized)) {
    return "MANUAL";
  }
  if (["2", "auto", "auto-post", "autopost", "automatic"].includes(normalized)) {
    return "AUTO_POST";
  }
  return null;
};

const getConversationContext = (state: { contextJson: Prisma.JsonValue | null }): ConversationContext => {
  return ((state.contextJson as ConversationContext | null) ?? {}) as ConversationContext;
};

const touchConversation = async (
  stateId: string,
  data: Prisma.ConversationStateUncheckedUpdateInput = {}
) => {
  return prisma.conversationState.update({
    where: { id: stateId },
    data: {
      ...data,
      lastMessageAt: new Date(),
    },
  });
};

const resetConversation = async (stateId: string) => {
  await touchConversation(stateId, { currentStep: "WELCOME", contextJson: Prisma.JsonNull });
};

const ensureBrandContext = async (stateId: string, context: ConversationContext): Promise<string | null> => {
  if (!context.brandId) {
    await resetConversation(stateId);
    return null;
  }

  return context.brandId;
};

const hasConnectedSocialAccount = async (userId: string | null | undefined): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  const count = await prisma.socialAccount.count({
    where: { userId },
  });

  return count > 0;
};

const ensurePreferenceProfile = async (brandId: string) => {
  const existing = await prisma.preferenceProfile.findUnique({
    where: { brandId },
  });

  if (existing) {
    return existing;
  }

  return prisma.preferenceProfile.create({
    data: { brandId },
  });
};

const promptForPostingDays = () => {
  return [
    "Almost there. How many days per week do you want BrandqoAI to post for you?",
    "",
    "Reply with one option:",
    "1. 1 day per week",
    "2. 2 days per week",
    "3. 3 days per week",
  ].join("\n");
};

const promptForPostsPerDay = () => {
  return [
    "Got it. How many posts do you want on each posting day?",
    "",
    "Reply with one option:",
    "1. 1 post per day",
    "2. 2 posts per day",
  ].join("\n");
};

const approvalModeExplanation = () => {
  return [
    "Before you choose, here's how each approval mode works:",
    "",
    "*Manual Approval* — Every post is drafted and queued for your review. Nothing goes live until you approve it on the dashboard. Best if you want full control over every caption and image before it's published.",
    "",
    "*Auto-Post* — Posts are automatically scheduled and published at the planned time without waiting for your approval. You can still edit or cancel upcoming posts on the dashboard, but the default is hands-off. Best if you want a set-it-and-forget-it workflow.",
  ].join("\n");
};

const promptForApprovalMode = () => {
  return [
    "How should approvals work?",
    "",
    "Reply with one option:",
    "1. Manual Approval",
    "2. Auto-Post",
  ].join("\n");
};

const onboardingCompletionMessage = (
  postingDaysPerWeek: number,
  postsPerDay: number,
  approvalMode: ApprovalMode,
  logoSaved: boolean
) => {
  const totalPerWeek = postingDaysPerWeek * postsPerDay;
  return [
    "You're all set! Your BrandqoAI account is now fully configured. 🎉",
    "",
    `Posting schedule: ${postingDaysPerWeek} day${postingDaysPerWeek > 1 ? "s" : ""}/week, ${postsPerDay} post${postsPerDay > 1 ? "s" : ""}/day (${totalPerWeek} post${totalPerWeek > 1 ? "s" : ""}/week total)`,
    `Approval mode: ${APPROVAL_LABELS[approvalMode]}`,
    logoSaved ? "Logo: saved for future generated social media images" : "Logo: not saved yet",
    "",
    "Your content calendar is now being generated. I'll have it ready shortly.",
    "In the meantime, you can ask me for content ideas, captions, and poster prompts.",
  ].join("\n");
};

const getDashboardUrl = () => env.appUrl ?? env.corsOrigin?.replace(/\/$/, "") ?? null;
const getBackendPublicUrl = () => env.backendPublicUrl?.replace(/\/$/, "") ?? null;

const createWhatsAppMagicDashboardLink = (params: { userId: string; fromPhone: string }) => {
  const dashboardUrl = getDashboardUrl();
  if (!dashboardUrl) {
    return null;
  }

  const token = createWhatsAppMagicLinkToken({
    userId: params.userId,
    whatsappPhone: params.fromPhone,
  });

  return `${dashboardUrl}/whatsapp-login?token=${encodeURIComponent(token)}`;
};

const socialConnectionRequiredMessage = (params?: { userId?: string | null; fromPhone?: string }) => {
  const magicLink =
    params?.userId && params?.fromPhone
      ? createWhatsAppMagicDashboardLink({ userId: params.userId, fromPhone: params.fromPhone })
      : null;
  const dashboardUrl = getDashboardUrl();

  return [
    "Your brand profile is saved, but onboarding cannot finish yet.",
    "",
    "Please connect at least one social account first on the web dashboard, then message me again and I’ll continue with your posting frequency and approval settings.",
    magicLink ? `Secure sign-in link: ${magicLink}` : dashboardUrl ? `Dashboard: ${dashboardUrl}/dashboard` : null,
    "",
    "After you connect a social account, come back here and send any message to continue.",
  ]
    .filter(Boolean)
    .join("\n");
};

const getStepPrompt = async (state: {
  id: string;
  userId?: string | null;
  contextJson: Prisma.JsonValue | null;
  currentStep?: string | null;
}): Promise<string> => {
  const step = (state.currentStep as ConversationStep | null) ?? "WELCOME";
  const context = getConversationContext(state);

  switch (step) {
    case "ASK_BRAND_NAME":
      return "First, what’s your brand or business name?";
    case "ASK_INDUSTRY":
      return "What industry or niche are you in? (e.g. fitness coaching, skincare, creator education)";
    case "ASK_AUDIENCE":
      return "Who’s your target audience? (e.g. busy professionals, small business owners, first-time founders)";
    case "ASK_TONE":
      return "What’s your brand’s tone of voice? (e.g. friendly and casual, professional and authoritative, witty and bold)";
    case "ASK_CONTENT_PILLARS":
      return "What 2 to 5 content pillars should I create around? Send them separated by commas.\n\nExample: education, testimonials, behind the scenes";
    case "ASK_LOGO_URL":
      return "Send your logo URL if you have one. I’ll use it later for generated social media images.\n\nReply skip if you don’t have one yet.";
    case "ASK_POSTING_DAYS":
      return promptForPostingDays();
    case "ASK_POSTS_PER_DAY":
      return promptForPostsPerDay();
    case "ASK_APPROVAL_MODE":
      return `${approvalModeExplanation()}\n\n${promptForApprovalMode()}`;
    case "WAIT_FOR_SOCIAL_CONNECTION":
      return socialConnectionRequiredMessage({ userId: state.userId });
    case "WELCOME":
    case "READY":
    default:
      return "Tell me a bit about your brand to get started.";
  }
};

const maybeResumeOnboarding = async (state: {
  id: string;
  userId?: string | null;
  currentStep?: string | null;
  lastMessageAt: Date;
  contextJson: Prisma.JsonValue | null;
}): Promise<string | null> => {
  const step = (state.currentStep as ConversationStep | null) ?? "WELCOME";
  if (step === "WELCOME" || step === "READY") {
    return null;
  }

  const inactiveLongEnough = Date.now() - state.lastMessageAt.getTime() >= RESUME_AFTER_MS;
  if (!inactiveLongEnough) {
    return null;
  }

  const context = getConversationContext(state);
  const brand = context.brandId
    ? await prisma.brandProfile.findUnique({ where: { id: context.brandId } })
    : null;
  const brandLabel = brand?.brandName ? ` ${brand.brandName}` : "";
  const prompt = await getStepPrompt(state);

  await touchConversation(state.id);

  return [`Welcome back${brandLabel}!`, "", `Let’s continue where we left off.`, prompt].join("\n");
};

export const handleIncomingWhatsAppText = async (params: HandleIncomingMessageParams): Promise<string> => {
  const { fromPhone, text } = params;

  let state = await prisma.conversationState.findUnique({
    where: {
      whatsappPhone: fromPhone,
    },
  });

  if (!state) {
    state = await prisma.conversationState.create({
      data: {
        whatsappPhone: fromPhone,
        currentStep: "WELCOME",
      },
    });
  }

  const cleanedText = normalizeText(text);

  if (cleanedText.toLowerCase() === "reset") {
    await resetConversation(state.id);
    return RESET_MESSAGE;
  }

  const resumeMessage = await maybeResumeOnboarding(state);
  if (resumeMessage) {
    return resumeMessage;
  }

  const step = (state.currentStep as ConversationStep | null) ?? "WELCOME";

  switch (step) {
    case "WELCOME": {
      await touchConversation(state.id, { currentStep: "ASK_BRAND_NAME" });
      return "Hey creator 👋 I’m your BrandqoAI assistant.\n\nFirst, what’s your brand or business name?";
    }

    case "ASK_BRAND_NAME": {
      const brandNameValidation = validateRequiredField(cleanedText, "brand name", { min: 2, max: 80 });
      if (!brandNameValidation.ok) {
        await touchConversation(state.id);
        return brandNameValidation.message;
      }

      const existingState = await prisma.conversationState.findUnique({
        where: { id: state.id },
      });
      const existingContext = existingState ? getConversationContext(existingState) : {};

      let userId = existingState?.userId ?? null;
      if (!userId) {
        const existingUser = await prisma.user.findUnique({
          where: { email: `${fromPhone}@brandqoai.local` },
        });

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const user = await prisma.user.create({
            data: {
              email: `${fromPhone}@brandqoai.local`,
              passwordHash: "whatsapp-onboarding",
              name: brandNameValidation.value,
            },
          });
          userId = user.id;
        }
      }

      let brandId = existingContext.brandId;
      if (brandId) {
        await prisma.brandProfile.update({
          where: { id: brandId },
          data: { brandName: brandNameValidation.value },
        });
      } else {
        const brand = await prisma.brandProfile.create({
          data: {
            userId,
            brandName: brandNameValidation.value,
          },
        });
        brandId = brand.id;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { name: brandNameValidation.value },
      });

      await touchConversation(state.id, {
        userId,
        currentStep: "ASK_INDUSTRY",
        contextJson: {
          brandId,
        },
      });

      return `Nice, ${brandNameValidation.value} sounds exciting.\n\nWhat industry or niche are you in? (e.g. fitness coaching, skincare, creator education)`;
    }

    case "ASK_INDUSTRY": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const industryValidation = validateRequiredField(cleanedText, "industry or niche", { min: 2, max: 100 });
      if (!industryValidation.ok) {
        await touchConversation(state.id);
        return industryValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          industry: industryValidation.value,
        },
      });

      await touchConversation(state.id, {
        currentStep: "ASK_AUDIENCE",
      });

      return "Great. Who’s your target audience? (e.g. busy professionals, small business owners, first-time founders)";
    }

    case "ASK_AUDIENCE": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const audienceValidation = validateRequiredField(cleanedText, "target audience", { min: 6, max: 180 });
      if (!audienceValidation.ok) {
        await touchConversation(state.id);
        return audienceValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          targetAudience: audienceValidation.value,
        },
      });

      await touchConversation(state.id, {
        currentStep: "ASK_TONE",
      });

      return "Perfect. What’s your brand’s tone of voice? (e.g. friendly and casual, professional and authoritative, witty and bold)";
    }

    case "ASK_TONE": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const toneValidation = validateRequiredField(cleanedText, "tone of voice", { min: 4, max: 140 });
      if (!toneValidation.ok) {
        await touchConversation(state.id);
        return toneValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          toneOfVoice: toneValidation.value,
        },
      });

      await touchConversation(state.id, {
        currentStep: "ASK_CONTENT_PILLARS",
      });

      return "Nice. What 2 to 5 content pillars should I create around? Send them separated by commas.\n\nExample: education, testimonials, behind the scenes";
    }

    case "ASK_CONTENT_PILLARS": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const pillarsValidation = validateContentPillars(cleanedText);
      if (!pillarsValidation.ok) {
        await touchConversation(state.id);
        return pillarsValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          contentPillars: pillarsValidation.value,
        },
      });

      await touchConversation(state.id, {
        currentStep: "ASK_LOGO_URL",
      });

      return "Last one for now: send your logo URL if you have one. I’ll use it later for generated social media images.\n\nReply skip if you don’t have one yet.";
    }

    case "ASK_LOGO_URL": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const logoValidation = validateOptionalLogoUrl(cleanedText);
      if (!logoValidation.ok) {
        await touchConversation(state.id);
        return logoValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          logoUrl: logoValidation.value,
        },
      });

      await ensurePreferenceProfile(brandId);

      const latestState = await prisma.conversationState.findUnique({ where: { id: state.id } });
      const userHasSocialAccount = await hasConnectedSocialAccount(latestState?.userId);

      if (!userHasSocialAccount) {
        await touchConversation(state.id, {
          currentStep: "WAIT_FOR_SOCIAL_CONNECTION",
        });
        return socialConnectionRequiredMessage({ userId: latestState?.userId, fromPhone });
      }

      await touchConversation(state.id, {
        currentStep: "ASK_POSTING_DAYS",
      });

      return promptForPostingDays();
    }

    case "WAIT_FOR_SOCIAL_CONNECTION": {
      const latestState = await prisma.conversationState.findUnique({ where: { id: state.id } });
      const userHasSocialAccount = await hasConnectedSocialAccount(latestState?.userId);

      if (!userHasSocialAccount) {
        await touchConversation(state.id);
        return socialConnectionRequiredMessage({ userId: latestState?.userId, fromPhone });
      }

      await touchConversation(state.id, { currentStep: "ASK_POSTING_DAYS" });

      return [
        "Nice — I can see you have at least one social account connected now.",
        "",
        promptForPostingDays(),
      ].join("\n");
    }

    case "ASK_POSTING_DAYS": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const postingDays = parsePostingDaysPerWeek(cleanedText);
      if (!postingDays) {
        await touchConversation(state.id);
        return `${promptForPostingDays()}\n\nPlease reply with 1, 2, or 3.`;
      }

      const context = getConversationContext(state);
      await touchConversation(state.id, {
        currentStep: "ASK_POSTS_PER_DAY",
        contextJson: { ...context, postingDaysPerWeek: postingDays },
      });

      return `${postingDays} day${postingDays > 1 ? "s" : ""} per week — got it.\n\n${promptForPostsPerDay()}`;
    }

    case "ASK_POSTS_PER_DAY": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const postsPerDay = parsePostsPerDay(cleanedText);
      if (!postsPerDay) {
        await touchConversation(state.id);
        return `${promptForPostsPerDay()}\n\nPlease reply with 1 or 2.`;
      }

      const context = getConversationContext(state);
      const postingDaysPerWeek = context.postingDaysPerWeek ?? 1;

      await prisma.preferenceProfile.upsert({
        where: { brandId },
        update: { postingDaysPerWeek, postsPerDay },
        create: { brandId, postingDaysPerWeek, postsPerDay },
      });

      await touchConversation(state.id, { currentStep: "ASK_APPROVAL_MODE" });

      const totalPerWeek = postingDaysPerWeek * postsPerDay;
      return [
        `${postsPerDay} post${postsPerDay > 1 ? "s" : ""} per day — that’s ${totalPerWeek} post${totalPerWeek > 1 ? "s" : ""} per week total.`,
        "",
        approvalModeExplanation(),
        "",
        promptForApprovalMode(),
      ].join("\n");
    }

    case "ASK_APPROVAL_MODE": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const approvalMode = parseApprovalMode(cleanedText);
      if (!approvalMode) {
        await touchConversation(state.id);
        return `${promptForApprovalMode()}\n\nPlease reply with 1, 2, manual, or auto-post.`;
      }

      const latestState = await prisma.conversationState.findUnique({ where: { id: state.id } });
      const userHasSocialAccount = await hasConnectedSocialAccount(latestState?.userId);
      if (!userHasSocialAccount) {
        await touchConversation(state.id, {
          currentStep: "WAIT_FOR_SOCIAL_CONNECTION",
        });
        return socialConnectionRequiredMessage({ userId: latestState?.userId, fromPhone });
      }

      const brand = await prisma.brandProfile.findUnique({ where: { id: brandId } });
      const preference = await prisma.preferenceProfile.upsert({
        where: { brandId },
        update: {
          approvalMode,
          onboardingCompletedAt: new Date(),
        },
        create: {
          brandId,
          approvalMode,
          onboardingCompletedAt: new Date(),
        },
      });

      await touchConversation(state.id, { currentStep: "READY" });

      const postingDaysPerWeek = preference.postingDaysPerWeek ?? 1;
      const postsPerDay = preference.postsPerDay ?? 1;

      try {
        await generateMonthlyCalendarForBrand(brandId);
      } catch (error) {
        console.error("Calendar generation failed after onboarding completion:", error);
        return [
          "Your onboarding is complete, but I hit a problem while generating your 30-day content calendar.",
          "",
          "I tried 3 times and it still failed. Please try again shortly or ask an admin to check the dashboard.",
        ].join("\n");
      }

      return onboardingCompletionMessage(
        postingDaysPerWeek,
        postsPerDay,
        approvalMode,
        Boolean(brand?.logoUrl)
      );
    }

    case "READY": {
      await touchConversation(state.id);
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Looks like I lost your brand details. Let’s start again. What’s your brand name?";
      }

      const ideas = await generateTestContentForBrand({
        brandId,
        userPrompt: text,
      });

      if (!ideas.length) {
        return "I wasn’t able to generate ideas just yet. Try again with a bit more detail about what you want to post.";
      }

      const previewLines = ideas
        .map(
          (idea, index) =>
            `Idea ${index + 1}:\nCaption:\n${idea.caption}\n\nImage prompt:\n${idea.imagePrompt}`
        )
        .join("\n\n---\n\n");

      return `Here are a couple of ideas based on what you said:\n\n${previewLines}\n\nReply “more” if you’d like extra options, or send a new brief.`;
    }

    default: {
      await resetConversation(state.id);
      return "Let’s start fresh. What’s your brand or business name?";
    }
  }
};
