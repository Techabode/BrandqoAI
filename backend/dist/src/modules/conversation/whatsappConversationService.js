"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIncomingWhatsAppText = void 0;
const client_1 = require("../../db/client");
const contentService_1 = require("../content/contentService");
const handleIncomingWhatsAppText = async (params) => {
    const { fromPhone, text } = params;
    let state = await client_1.prisma.conversationState.findUnique({
        where: {
            whatsappPhone: fromPhone,
        },
    });
    if (!state) {
        state = await client_1.prisma.conversationState.create({
            data: {
                whatsappPhone: fromPhone,
                currentStep: "WELCOME",
            },
        });
    }
    const step = state.currentStep ?? "WELCOME";
    if (text.trim().toLowerCase() === "reset") {
        await client_1.prisma.conversationState.update({
            where: { id: state.id },
            data: { currentStep: "WELCOME", contextJson: client_1.Prisma.JsonNull },
        });
        return "Okay, I’ve reset our conversation. Tell me a bit about your brand to get started.";
    }
    switch (step) {
        case "WELCOME": {
            await client_1.prisma.conversationState.update({
                where: { id: state.id },
                data: { currentStep: "ASK_BRAND_NAME" },
            });
            return "Hey creator 👋 I’m your BrandqoAI assistant.\n\nFirst, what’s your brand or business name?";
        }
        case "ASK_BRAND_NAME": {
            const brandName = text.trim();
            const user = await client_1.prisma.user.create({
                data: {
                    email: `${fromPhone}@brandqoai.local`,
                    passwordHash: "whatsapp-onboarding",
                    name: brandName,
                },
            });
            const brand = await client_1.prisma.brandProfile.create({
                data: {
                    userId: user.id,
                    brandName,
                },
            });
            await client_1.prisma.conversationState.update({
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
            const context = state.contextJson ?? {};
            if (!context.brandId) {
                await client_1.prisma.conversationState.update({
                    where: { id: state.id },
                    data: { currentStep: "WELCOME", contextJson: client_1.Prisma.JsonNull },
                });
                return "Let’s start again. What’s your brand name?";
            }
            const industry = text.trim();
            await client_1.prisma.brandProfile.update({
                where: { id: context.brandId },
                data: {
                    industry,
                },
            });
            await client_1.prisma.conversationState.update({
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
            const context = state.contextJson ?? {};
            if (!context.brandId) {
                await client_1.prisma.conversationState.update({
                    where: { id: state.id },
                    data: { currentStep: "WELCOME", contextJson: client_1.Prisma.JsonNull },
                });
                return "Looks like I lost your brand details. Let’s start again. What’s your brand name?";
            }
            const ideas = await (0, contentService_1.generateTestContentForBrand)({
                brandId: context.brandId,
                userPrompt: text,
            });
            if (!ideas.length) {
                return "I wasn’t able to generate ideas just yet. Try again with a bit more detail about what you want to post.";
            }
            const previewLines = ideas
                .map((idea, index) => `Idea ${index + 1}:\nCaption:\n${idea.caption}\n\nImage prompt:\n${idea.imagePrompt}`)
                .join("\n\n---\n\n");
            return `Here are a couple of ideas based on what you said:\n\n${previewLines}\n\nReply “more” if you’d like extra options, or send a new brief.`;
        }
        default: {
            await client_1.prisma.conversationState.update({
                where: { id: state.id },
                data: { currentStep: "WELCOME", contextJson: client_1.Prisma.JsonNull },
            });
            return "Let’s start fresh. What’s your brand or business name?";
        }
    }
};
exports.handleIncomingWhatsAppText = handleIncomingWhatsAppText;
