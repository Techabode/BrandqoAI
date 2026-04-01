import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthenticatedRequest } from "../auth/authMiddleware";
import { prisma } from "../../db/client";
import { generateMonthlyCalendarForBrand, generateTestContentForBrand } from "../content/contentService";

const router = Router();

const updateCalendarEntrySchema = z.object({
  caption: z.string().trim().min(1).max(2200).optional(),
  scheduledTime: z.string().datetime().optional(),
  imagePrompt: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
});

const resolveDashboardStatus = (
  scheduledStatus: "PENDING" | "SENT" | "FAILED" | "CANCELLED",
  approvalMode: "MANUAL" | "AUTO_POST" | null | undefined,
) => {
  if (scheduledStatus === "PENDING" && approvalMode === "MANUAL") {
    return "AWAITING_APPROVAL" as const;
  }

  return scheduledStatus;
};

const serializeEntry = (brand: {
  id: string;
  brandName: string;
  preferences: { postingDaysPerWeek: number | null; postsPerDay: number | null; approvalMode?: "MANUAL" | "AUTO_POST" | null } | null;
}, template: {
  id: string;
  caption: string;
  imagePrompt: string | null;
  imageUrl: string | null;
  contentIdea: { title: string } | null;
}, scheduledPost: {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "TWITTER";
  status: "PENDING" | "SENT" | "FAILED" | "CANCELLED";
  scheduledTime: Date;
  errorMessage: string | null;
}) => ({
  id: scheduledPost.id,
  postTemplateId: template.id,
  brandId: brand.id,
  brandName: brand.brandName,
  title: template.contentIdea?.title ?? template.caption.slice(0, 80),
  caption: template.caption,
  imagePrompt: template.imagePrompt,
  imageUrl: template.imageUrl,
  platform: scheduledPost.platform,
  status: resolveDashboardStatus(scheduledPost.status, brand.preferences?.approvalMode),
  rawStatus: scheduledPost.status,
  approvalMode: brand.preferences?.approvalMode ?? null,
  scheduledTime: scheduledPost.scheduledTime,
  errorMessage: scheduledPost.errorMessage,
  postingDaysPerWeek: brand.preferences?.postingDaysPerWeek ?? null,
  postsPerDay: brand.preferences?.postsPerDay ?? null,
});

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

// GET /api/content/calendar - Get scheduled calendar entries for the authenticated user's brand(s)
router.get("/calendar", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const brandId = typeof req.query.brandId === "string" ? req.query.brandId : undefined;
    const month = typeof req.query.month === "string" ? req.query.month : undefined;

    const monthStart = month ? new Date(`${month}-01T00:00:00.000Z`) : undefined;
    const monthEnd = monthStart
      ? new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0, 0))
      : undefined;

    const brands = await prisma.brandProfile.findMany({
      where: {
        userId: req.user!.id,
        ...(brandId ? { id: brandId } : {}),
      },
      include: {
        preferences: true,
        postTemplates: {
          include: {
            scheduledPosts: {
              where: monthStart && monthEnd ? {
                scheduledTime: {
                  gte: monthStart,
                  lt: monthEnd,
                },
              } : undefined,
              orderBy: {
                scheduledTime: "asc",
              },
            },
            contentIdea: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const entries = brands.flatMap((brand) =>
      brand.postTemplates.flatMap((template) =>
        template.scheduledPosts.map((scheduledPost) => serializeEntry(brand, template, scheduledPost)),
      ),
    );

    const upcomingEntries = [...entries]
      .filter((entry) => new Date(entry.scheduledTime).getTime() >= Date.now())
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
      .slice(0, 8);

    res.json({
      brands: brands.map((brand) => ({
        id: brand.id,
        brandName: brand.brandName,
        industry: brand.industry,
        targetAudience: brand.targetAudience,
        toneOfVoice: brand.toneOfVoice,
        contentPillars: brand.contentPillars,
        postingDaysPerWeek: brand.preferences?.postingDaysPerWeek ?? null,
        postsPerDay: brand.preferences?.postsPerDay ?? null,
        approvalMode: brand.preferences?.approvalMode ?? null,
      })),
      summary: {
        totalBrands: brands.length,
        totalScheduledPosts: entries.length,
        upcomingCount: upcomingEntries.length,
      },
      upcomingEntries,
      entries: entries.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()),
    });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    res.status(500).json({ error: "Failed to fetch calendar" });
  }
});

// PATCH /api/content/calendar/:scheduledPostId - Edit a scheduled calendar entry
router.patch("/calendar/:scheduledPostId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const scheduledPostId = Array.isArray(req.params.scheduledPostId)
      ? req.params.scheduledPostId[0]
      : req.params.scheduledPostId;

    const parsed = updateCalendarEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid calendar entry payload", details: parsed.error.flatten() });
    }

    const scheduledPost = await prisma.scheduledPost.findFirst({
      where: {
        id: scheduledPostId,
        postTemplate: {
          brand: {
            userId: req.user!.id,
          },
        },
      },
      include: {
        postTemplate: {
          include: {
            contentIdea: true,
            brand: {
              include: {
                preferences: true,
              },
            },
          },
        },
      },
    });

    if (!scheduledPost) {
      return res.status(404).json({ error: "Scheduled post not found" });
    }

    const { caption, scheduledTime, imagePrompt, imageUrl } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      if (caption !== undefined || imagePrompt !== undefined || imageUrl !== undefined) {
        await tx.postTemplate.update({
          where: { id: scheduledPost.postTemplateId },
          data: {
            ...(caption !== undefined ? { caption } : {}),
            ...(imagePrompt !== undefined ? { imagePrompt } : {}),
            ...(imageUrl !== undefined ? { imageUrl } : {}),
          },
        });
      }

      if (scheduledTime !== undefined) {
        await tx.scheduledPost.update({
          where: { id: scheduledPost.id },
          data: {
            scheduledTime: new Date(scheduledTime),
          },
        });
      }

      return tx.scheduledPost.findUniqueOrThrow({
        where: { id: scheduledPost.id },
        include: {
          postTemplate: {
            include: {
              contentIdea: true,
              brand: {
                include: {
                  preferences: true,
                },
              },
            },
          },
        },
      });
    });

    res.json({
      entry: serializeEntry(updated.postTemplate.brand, updated.postTemplate, updated),
      message: "Calendar entry updated successfully",
    });
  } catch (error) {
    console.error("Calendar update error:", error);
    res.status(500).json({ error: "Failed to update calendar entry" });
  }
});

// POST /api/content/calendar/:scheduledPostId/approve - Approve a pending post
router.post("/calendar/:scheduledPostId/approve", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const scheduledPostId = Array.isArray(req.params.scheduledPostId)
      ? req.params.scheduledPostId[0]
      : req.params.scheduledPostId;

    const scheduledPost = await prisma.scheduledPost.findFirst({
      where: {
        id: scheduledPostId,
        postTemplate: {
          brand: {
            userId: req.user!.id,
          },
        },
      },
      include: {
        postTemplate: {
          include: {
            contentIdea: true,
            brand: {
              include: {
                preferences: true,
              },
            },
          },
        },
      },
    });

    if (!scheduledPost) {
      return res.status(404).json({ error: "Scheduled post not found" });
    }

    if (scheduledPost.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending posts can be approved" });
    }

    const updated = await prisma.scheduledPost.update({
      where: { id: scheduledPost.id },
      data: {
        status: "PENDING",
        errorMessage: null,
      },
      include: {
        postTemplate: {
          include: {
            contentIdea: true,
            brand: {
              include: {
                preferences: true,
              },
            },
          },
        },
      },
    });

    res.json({
      entry: serializeEntry(updated.postTemplate.brand, updated.postTemplate, updated),
      message: "Post approved successfully",
    });
  } catch (error) {
    console.error("Calendar approval error:", error);
    res.status(500).json({ error: "Failed to approve post" });
  }
});

// DELETE /api/content/calendar/:scheduledPostId - Remove a scheduled calendar entry
router.delete("/calendar/:scheduledPostId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const scheduledPostId = Array.isArray(req.params.scheduledPostId)
      ? req.params.scheduledPostId[0]
      : req.params.scheduledPostId;

    const scheduledPost = await prisma.scheduledPost.findFirst({
      where: {
        id: scheduledPostId,
        postTemplate: {
          brand: {
            userId: req.user!.id,
          },
        },
      },
      include: {
        postTemplate: {
          include: {
            scheduledPosts: true,
          },
        },
      },
    });

    if (!scheduledPost) {
      return res.status(404).json({ error: "Scheduled post not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.scheduledPost.delete({
        where: { id: scheduledPost.id },
      });

      if (scheduledPost.postTemplate.scheduledPosts.length === 1) {
        await tx.postTemplate.delete({
          where: { id: scheduledPost.postTemplateId },
        });
      }
    });

    res.json({ success: true, message: "Calendar entry deleted successfully" });
  } catch (error) {
    console.error("Calendar delete error:", error);
    res.status(500).json({ error: "Failed to delete calendar entry" });
  }
});

export { router as contentRouter };
