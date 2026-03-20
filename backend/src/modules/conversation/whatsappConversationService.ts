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
  | "READY";

interface HandleIncomingMessageParams {
  fromPhone: string;
  text: string;
}

interface ConversationContext {
  brandId?: string;
}

const RESET_MESSAGE = "Okay, I’ve reset our conversation. Tell me a bit about your brand to get started.";
const SKIP_VALUES = new Set(["skip", "none", "no", "n/a"]);

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

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          currentStep: "READY",
        },
      });

      return [
        "Awesome! Your brand profile is set up. 🎉",
        "",
        logoValidation.value
          ? "I’ve saved your logo too, so we can use it in future generated social media images."
          : "No logo saved yet — that’s okay, we can add one later.",
        "",
        "You can now ask me for content ideas, captions, and poster prompts. For example:",
        '- "I want 5 posts for next week about my new product launch"',
        '- "Give me 3 hooks for an Instagram post about my webinar"',
        '- "Create a carousel post idea about [topic]"',
      ].join("\n");
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
