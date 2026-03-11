import { prisma, Prisma } from "../../db/client";
import { generateTestContentForBrand } from "../content/contentService";

type ConversationStep = "WELCOME" | "ASK_BRAND_NAME" | "ASK_INDUSTRY" | "READY";

interface HandleIncomingMessageParams {
  fromPhone: string;
  text: string;
}

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

  if (text.trim().toLowerCase() === "reset") {
    await prisma.conversationState.update({
      where: { id: state.id },
      data: { currentStep: "WELCOME", contextJson: Prisma.JsonNull },
    });
    return "Okay, I’ve reset our conversation. Tell me a bit about your brand to get started.";
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
      const brandName = text.trim();
      const user = await prisma.user.create({
        data: {
          email: `${fromPhone}@brandqoai.local`,
          passwordHash: "whatsapp-onboarding",
          name: brandName,
        },
      });

      const brand = await prisma.brandProfile.create({
        data: {
          userId: user.id,
          brandName,
        },
      });

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          userId: user.id,
          currentStep: "ASK_INDUSTRY",
          contextJson: {
            brandId: brand.id,
          },
        },
      });

      return `Nice, ${brandName} sounds exciting.\n\nWhat industry or niche are you in? (e.g. fitness coaching, skincare, creator education)`;
    }

    case "ASK_INDUSTRY": {
      const context = (state.contextJson as { brandId?: string } | null) ?? {};
      if (!context.brandId) {
        await prisma.conversationState.update({
          where: { id: state.id },
          data: { currentStep: "WELCOME", contextJson: Prisma.JsonNull },
        });
        return "Let’s start again. What’s your brand name?";
      }

      const industry = text.trim();

      await prisma.brandProfile.update({
        where: { id: context.brandId },
        data: {
          industry,
        },
      });

      await prisma.conversationState.update({
        where: { id: state.id },
        data: {
          currentStep: "READY",
        },
      });

      return [
        "Got it, thanks.",
        "",
        "You can now ask me for ideas, captions, and poster prompts. For example:",
        "- “I want 5 posts for next week about my new product launch”",
        "- “Give me 3 hooks for an Instagram post about my webinar”",
      ].join("\n");
    }

    case "READY": {
      const context = (state.contextJson as { brandId?: string } | null) ?? {};
      if (!context.brandId) {
        await prisma.conversationState.update({
          where: { id: state.id },
          data: { currentStep: "WELCOME", contextJson: Prisma.JsonNull },
        });
        return "Looks like I lost your brand details. Let’s start again. What’s your brand name?";
      }

      const ideas = await generateTestContentForBrand({
        brandId: context.brandId,
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
      await prisma.conversationState.update({
        where: { id: state.id },
        data: { currentStep: "WELCOME", contextJson: Prisma.JsonNull },
      });
      return "Let’s start fresh. What’s your brand or business name?";
    }
  }
};

