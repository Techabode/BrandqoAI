"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestContentForBrand = void 0;
const client_1 = require("../../db/client");
const generateTestContentForBrand = async (params) => {
    const brand = await client_1.prisma.brandProfile.findUnique({
        where: { id: params.brandId },
        include: {
            preferences: true,
        },
    });
    if (!brand) {
        return [];
    }
    const basePrompt = [
        `Brand name: ${brand.brandName}`,
        brand.industry ? `Industry: ${brand.industry}` : null,
        brand.targetAudience ? `Target audience: ${brand.targetAudience}` : null,
        brand.toneOfVoice ? `Tone of voice: ${brand.toneOfVoice}` : null,
        brand.contentPillars ? `Content pillars: ${brand.contentPillars}` : null,
        `User request: ${params.userPrompt}`,
    ]
        .filter(Boolean)
        .join("\n");
    // Placeholder deterministic generation for MVP; swap with real LLM later.
    const ideas = [
        {
            caption: `✨ ${brand.brandName}: ${params.userPrompt} (hero post)\n\nTell your audience what is new, why it matters, and how it helps them in 2–3 short paragraphs.`,
            imagePrompt: `Minimal, bold poster for ${brand.brandName}, highlighting: ${params.userPrompt}. Clean typography, high contrast, social-media ready.`,
        },
        {
            caption: `💡 Behind the scenes: ${params.userPrompt}\n\nExplain the story and motivation in a friendly, human tone. End with a clear call to action.`,
            imagePrompt: `Warm, behind-the-scenes style illustration for ${brand.brandName}, showing creative process around: ${params.userPrompt}.`,
        },
    ];
    await client_1.prisma.contentIdea.create({
        data: {
            brandId: brand.id,
            title: `Auto-generated ideas for: ${params.userPrompt}`,
            description: basePrompt.slice(0, 500),
            postTemplates: {
                create: ideas.map((idea) => ({
                    platform: "INSTAGRAM",
                    caption: idea.caption,
                    imagePrompt: idea.imagePrompt,
                    status: "DRAFT",
                    brand: { connect: { id: brand.id } },
                })),
            },
        },
    });
    return ideas;
};
exports.generateTestContentForBrand = generateTestContentForBrand;
