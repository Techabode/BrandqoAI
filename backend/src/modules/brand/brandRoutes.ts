import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../auth/authMiddleware";
import { prisma } from "../../db/client";

const router = Router();

/**
 * @swagger
 * /api/brand:
 *   get:
 *     summary: Get all brands for the authenticated user
 *     tags: [Brands]
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: List of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 brands:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BrandProfile'
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const brands = await prisma.brandProfile.findMany({
            where: { userId: req.user!.id },
            include: {
                preferences: true,
            },
        });

        res.json({ brands });
    } catch (error) {
        console.error("Brand fetch error:", error);
        res.status(500).json({ error: "Failed to fetch brands" });
    }
});

// GET /api/brand/:id - Get a specific brand
/**
 * @swagger
 * /api/brand/{id}:
 *   get:
 *     summary: Get a specific brand
 *     tags: [Brands]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 brand:
 *                   $ref: '#/components/schemas/BrandProfile'
 *       404:
 *         description: Brand not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;

        const brand = await prisma.brandProfile.findFirst({
            where: { id: id as string, userId: req.user!.id },
            include: {
                preferences: true,
            },
        });

        if (!brand) {
            return res.status(404).json({ error: "Brand not found" });
        }

        res.json({ brand });
    } catch (error) {
        console.error("Brand fetch error:", error);
        res.status(500).json({ error: "Failed to fetch brand" });
    }
});

// POST /api/brand - Create a new brand
/**
 * @swagger
 * /api/brand:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brandName:
 *                 type: string
 *               industry:
 *                 type: string
 *               targetAudience:
 *                 type: string
 *               toneOfVoice:
 *                 type: string
 *     responses:
 *       201:
 *         description: Brand created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 brand:
 *                   $ref: '#/components/schemas/BrandProfile'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const { brandName, industry, targetAudience, toneOfVoice } = req.body;

        const brand = await prisma.brandProfile.create({
            data: {
                userId: req.user!.id,
                brandName,
                industry,
                targetAudience,
                toneOfVoice,
            },
        });

        res.status(201).json({ brand });
    } catch (error) {
        console.error("Brand creation error:", error);
        res.status(500).json({ error: "Failed to create brand" });
    }
});

export { router as brandRouter };
