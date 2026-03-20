import { prisma, Prisma } from "../../db/client";
import { generateTestContentForBrand } from "../content/contentService";

type ConversationStep =
  | "WELCOME"
  | "ASK_BRAND_NAME"
  | "ASK_INDUSTRY"
  | "ASK_AUDIENCE"
  | "ASK_TONE"
  | "ASK_CONTENT_PILLARS"
  | "ASK_LOGO_URL"
  | "ASK_POSTING_FREQUENCY"
  | "ASK_APPROVAL_MODE"
  | "WAIT_FOR_SOCIAL_CONNECTION"
  | "READY";

type PostingFrequency = "daily" | "3_per_week" | "weekly";
type ApprovalMode = "MANUAL" | "AUTO_POST";

interface HandleIncomingMessageParams {
  fromPhone: string;
  text: string;
}

interface ConversationContext {
  brandId?: string;
}

const RESET_MESSAGE = "Okay, I’ve reset our conversation. Tell me a bit about your brand to get started.";
const SKIP_VALUES = new Set(["skip", "none", "no", "n/a"]);
const FREQUENCY_LABELS: Record<PostingFrequency, string> = {
  daily: "daily",
  "3_per_week": "3x per week",
  weekly: "weekly",
};
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

const parsePostingFrequency = (input: string): PostingFrequency | null => {
  const normalized = normalizeText(input).toLowerCase();
  if (["1", "daily", "every day", "everyday"].includes(normalized)) {
    return "daily";
  }
  if (["2", "3x", "3x per week", "three times per week", "3 per week"].includes(normalized)) {
    return "3_per_week";
  }
  if (["3", "weekly", "once a week"].includes(normalized)) {
    return "weekly";
  }
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

const resetConversation = async (stateId: string) => {
  await prisma.conversationState.update({
    where: { id: stateId },
    data: { currentStep: "WELCOME", contextJson: Prisma.JsonNull },
  });
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

const promptForPostingFrequency = () => {
  return [
    "Almost there. How often do you want BrandqoAI to post for you?",
    "",
    "Reply with one option:",
    "1. daily",
    "2. 3x per week",
    "3. weekly",
  ].join("\n");
};

const promptForApprovalMode = () => {
  return [
    "Nice. How should approvals work?",
    "",
    "Reply with one option:",
    "1. manual approval",
    "2. auto-post",
  ].join("\n");
};

const onboardingCompletionMessage = (
  frequency: PostingFrequency,
  approvalMode: ApprovalMode,
  logoSaved: boolean
) => {
  return [
    "Awesome! Your onboarding is fully complete. 🎉",
    "",
    `Posting frequency: ${FREQUENCY_LABELS[frequency]}`,
    `Approval mode: ${APPROVAL_LABELS[approvalMode]}`,
    logoSaved ? "Logo: saved for future generated social media images" : "Logo: not saved yet",
    "",
    "Your content calendar is now being generated.",
    "You can now ask me for content ideas, captions, and poster prompts while that gets prepared.",
  ].join("\n");
};

const socialConnectionRequiredMessage = () => {
  return [
    "Your brand profile is saved, but onboarding cannot finish yet.",
    "",
    "Please connect at least one social account first, then message me again and I’ll continue with your posting frequency and approval settings.",
  ].join("\n");
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

  const step = (state.currentStep as ConversationStep | null) ?? "WELCOME";
  const cleanedText = normalizeText(text);

  if (cleanedText.toLowerCase() === "reset") {
    await resetConversation(state.id);
    return RESET_MESSAGE;
  }

  switch (step) {
    case "WELCOME": {
      await prisma.conversationState.update({
        where: { id: state.id },
        data: { currentStep: "ASK_BRAND_NAME" },
      });
      return "Hey creator 👋 I’m your BrandqoAI assistant.\n\nFirst, what’s your brand or business name?";
    }

    case "ASK_BRAND_NAME": {
      const brandNameValidation = validateRequiredField(cleanedText, "brand name", { min: 2, max: 80 });
      if (!brandNameValidation.ok) {
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

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          userId,
          currentStep: "ASK_INDUSTRY",
          contextJson: {
            brandId,
          },
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
        return industryValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          industry: industryValidation.value,
        },
      });

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          currentStep: "ASK_AUDIENCE",
        },
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
        return audienceValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          targetAudience: audienceValidation.value,
        },
      });

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          currentStep: "ASK_TONE",
        },
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
        return toneValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          toneOfVoice: toneValidation.value,
        },
      });

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          currentStep: "ASK_CONTENT_PILLARS",
        },
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
        return pillarsValidation.message;
      }

      await prisma.brandProfile.update({
        where: { id: brandId },
        data: {
          contentPillars: pillarsValidation.value,
        },
      });

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          currentStep: "ASK_LOGO_URL",
        },
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
        await prisma.conversationState.update({
          where: { id: state.id },
          data: {
            currentStep: "WAIT_FOR_SOCIAL_CONNECTION",
          },
        });
        return socialConnectionRequiredMessage();
      }

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          currentStep: "ASK_POSTING_FREQUENCY",
        },
      });

      return promptForPostingFrequency();
    }

    case "WAIT_FOR_SOCIAL_CONNECTION": {
      const latestState = await prisma.conversationState.findUnique({ where: { id: state.id } });
      const userHasSocialAccount = await hasConnectedSocialAccount(latestState?.userId);

      if (!userHasSocialAccount) {
        return socialConnectionRequiredMessage();
      }

      await prisma.conversationState.update({
        where: { id: state.id },
        data: { currentStep: "ASK_POSTING_FREQUENCY" },
      });

      return [
        "Nice — I can see you have at least one social account connected now.",
        "",
        promptForPostingFrequency(),
      ].join("\n");
    }

    case "ASK_POSTING_FREQUENCY": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const frequency = parsePostingFrequency(cleanedText);
      if (!frequency) {
        return `${promptForPostingFrequency()}\n\nPlease reply with 1, 2, 3, daily, 3x per week, or weekly.`;
      }

      await prisma.preferenceProfile.upsert({
        where: { brandId },
        update: { postingFrequency: frequency },
        create: { brandId, postingFrequency: frequency },
      });

      await prisma.conversationState.update({
        where: { id: state.id },
        data: { currentStep: "ASK_APPROVAL_MODE" },
      });

      return `${FREQUENCY_LABELS[frequency]} — got it.\n\n${promptForApprovalMode()}`;
    }

    case "ASK_APPROVAL_MODE": {
      const brandId = await ensureBrandContext(state.id, getConversationContext(state));
      if (!brandId) {
        return "Let’s start again. What’s your brand name?";
      }

      const approvalMode = parseApprovalMode(cleanedText);
      if (!approvalMode) {
        return `${promptForApprovalMode()}\n\nPlease reply with 1, 2, manual, or auto-post.`;
      }

      const latestState = await prisma.conversationState.findUnique({ where: { id: state.id } });
      const userHasSocialAccount = await hasConnectedSocialAccount(latestState?.userId);
      if (!userHasSocialAccount) {
        await prisma.conversationState.update({
          where: { id: state.id },
          data: { currentStep: "WAIT_FOR_SOCIAL_CONNECTION" },
        });
        return socialConnectionRequiredMessage();
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

      await prisma.conversationState.update({
        where: { id: state.id },
        data: { currentStep: "READY" },
      });

      return onboardingCompletionMessage(
        (preference.postingFrequency as PostingFrequency) ?? "weekly",
        approvalMode,
        Boolean(brand?.logoUrl)
      );
    }

    case "READY": {
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
