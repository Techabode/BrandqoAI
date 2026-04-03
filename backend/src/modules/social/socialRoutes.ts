import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/client";
import { requireAuth, type AuthenticatedRequest } from "../auth/authMiddleware";

const socialRouter = Router();

const connectSocialAccountSchema = z.object({
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "TWITTER"]),
  handle: z.string().trim().min(2).max(60),
  externalPageId: z.string().trim().min(2).max(120).optional(),
});

socialRouter.use(requireAuth);

socialRouter.get("/accounts", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      platform: true,
      handle: true,
      externalPageId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.json({ accounts });
});

socialRouter.post("/accounts", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const parsed = connectSocialAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid social account payload",
      errors: z.flattenError(parsed.error),
    });
  }

  const { platform, handle, externalPageId } = parsed.data;
  const normalizedHandle = handle.replace(/^@+/, "");
  const resolvedExternalPageId =
    externalPageId?.trim() || `${platform.toLowerCase()}-${normalizedHandle.toLowerCase()}`;

  const existing = await prisma.socialAccount.findFirst({
    where: {
      userId,
      platform,
      OR: [{ handle: normalizedHandle }, { externalPageId: resolvedExternalPageId }],
    },
    select: { id: true },
  });

  if (existing) {
    return res.status(409).json({ message: "That social account is already connected." });
  }

  const account = await prisma.socialAccount.create({
    data: {
      userId,
      platform,
      handle: normalizedHandle,
      externalPageId: resolvedExternalPageId,
      accessTokenEncrypted: "manual-connect-placeholder",
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      scopes: "manual-connect",
    },
    select: {
      id: true,
      platform: true,
      handle: true,
      externalPageId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(201).json({
    message: "Social account connected successfully",
    account,
  });
});

export { socialRouter };
