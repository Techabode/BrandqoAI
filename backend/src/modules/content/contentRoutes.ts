import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../auth/authMiddleware";
import { generateTestContentForBrand } from "../content/contentService";

const router = Router();

// POST /api/content/generate - Generate content for a brand
/**
 * @swagger
 * /api/content/generate:
 *   post:
 *     summary: Generate content for a brand
 *     tags: [Content]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brandId
 *               - userPrompt
 *             properties:
 *               brandId:
 *                 type: string
 *               userPrompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       caption:
 *                         type: string
 *                       imagePrompt:
 *                         type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
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

export { router as contentRouter };
