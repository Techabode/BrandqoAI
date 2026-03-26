import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../auth/authMiddleware";
import { prisma } from "../../db/client";
import { generateMonthlyCalendarForBrand, generateTestContentForBrand } from "../content/contentService";

const router = Router();

// POST /api/content/generate - Generate content for a brand
router.post("/generate", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { brandId, userPrompt } = req.body;

    if (!brandId || !userPrompt) {
      return res.status(400).json({ error: "brandId and userPrompt are required" });
    }

    const content = await generateTestContentForBrand({
      brandId,
      userPrompt,
    });

    res.json({ content });
  } catch (error) {
    console.error("Content generation error:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

// POST /api/content/calendar/generate - Generate 30-day content calendar for a brand
router.post("/calendar/generate", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "brandId is required" });
    }

    const brand = await prisma.brandProfile.findFirst({
      where: {
        id: brandId,
        userId: req.user!.id,
      },
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const result = await generateMonthlyCalendarForBrand(brandId);
    res.json(result);
  } catch (error) {
    console.error("Calendar generation error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate calendar" });
  }
});

export { router as contentRouter };
