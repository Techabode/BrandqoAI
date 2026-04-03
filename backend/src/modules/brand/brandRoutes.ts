import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthenticatedRequest } from "../auth/authMiddleware";
import { prisma } from "../../db/client";

const router = Router();

const brandInputSchema = z.object({
  brandName: z.string().trim().min(2).max(80),
  industry: z.string().trim().min(2).max(100).optional(),
  targetAudience: z.string().trim().min(6).max(180).optional(),
  toneOfVoice: z.string().trim().min(4).max(140).optional(),
  contentPillars: z.string().trim().min(3).max(240).optional(),
  logoUrl: z.string().trim().url().optional(),
});

const brandUpdateSchema = z.object({
  brandName: z.string().trim().min(2).max(80),
  industry: z.string().trim().min(2).max(100).optional(),
  targetAudience: z.string().trim().min(6).max(180).optional(),
  toneOfVoice: z.string().trim().min(4).max(140).optional(),
  contentPillars: z.string().trim().min(3).max(240).optional(),
  logoUrl: z.string().trim().url().optional(),
  postingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  postsPerDay: z.number().int().min(1).max(3).optional(),
  approvalMode: z.enum(["MANUAL", "AUTO_POST"]).optional(),
});

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
 *               contentPillars:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *                 format: uri
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = brandInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid brand payload",
        details: parsed.error.flatten(),
      });
    }

    const { brandName, industry, targetAudience, toneOfVoice, contentPillars, logoUrl } = parsed.data;

    const brand = await prisma.brandProfile.create({
      data: {
        userId: req.user!.id,
        brandName,
        industry,
        targetAudience,
        toneOfVoice,
        contentPillars,
        logoUrl,
      },
    });

    res.status(201).json({ brand });
  } catch (error) {
    console.error("Brand creation error:", error);
    res.status(500).json({ error: "Failed to create brand" });
  }
});

router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = brandUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid brand update payload",
        details: parsed.error.flatten(),
      });
    }

    const existingBrand = await prisma.brandProfile.findFirst({
      where: { id: id as string, userId: req.user!.id },
      include: { preferences: true },
    });

    if (!existingBrand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const {
      brandName,
      industry,
      targetAudience,
      toneOfVoice,
      contentPillars,
      logoUrl,
      postingDaysPerWeek,
      postsPerDay,
      approvalMode,
    } = parsed.data;

    const brand = await prisma.brandProfile.update({
      where: { id: existingBrand.id },
      data: {
        brandName,
        industry,
        targetAudience,
        toneOfVoice,
        contentPillars,
        logoUrl,
      },
      include: { preferences: true },
    });

    const shouldUpdatePreferences =
      postingDaysPerWeek !== undefined || postsPerDay !== undefined || approvalMode !== undefined;

    const preferences = shouldUpdatePreferences
      ? await prisma.preferenceProfile.upsert({
          where: { brandId: existingBrand.id },
          update: {
            ...(postingDaysPerWeek !== undefined ? { postingDaysPerWeek } : {}),
            ...(postsPerDay !== undefined ? { postsPerDay } : {}),
            ...(approvalMode !== undefined ? { approvalMode } : {}),
          },
          create: {
            brandId: existingBrand.id,
            postingDaysPerWeek,
            postsPerDay,
            approvalMode,
          },
        })
      : brand.preferences;

    res.json({
      message: "Brand settings updated successfully",
      brand: {
        ...brand,
        preferences,
      },
    });
  } catch (error) {
    console.error("Brand update error:", error);
    res.status(500).json({ error: "Failed to update brand settings" });
  }
});

export { router as brandRouter };
