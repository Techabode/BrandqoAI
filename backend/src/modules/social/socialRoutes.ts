import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/client";
import { env } from "../../config/env";
import { requireAuth, type AuthenticatedRequest } from "../auth/authMiddleware";

const socialRouter = Router();

const metaConnectSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM"]).default("FACEBOOK"),
  origin: z.enum(["dashboard", "whatsapp"]).default("dashboard"),
  redirect: z.string().trim().optional(),
});

const selectMetaAssetsSchema = z.object({
  session: z.string().trim().min(10),
  assetIds: z.array(z.string().trim().min(1)).min(1),
});

type MetaAsset = {
  id: string;
  platform: "FACEBOOK" | "INSTAGRAM";
  handle: string;
  accountName: string;
  pageId: string | null;
  pageName: string | null;
  instagramBusinessId: string | null;
  accessToken: string;
  scopes: string[];
  metadata: string;
};

const metaOAuthSessions = new Map<
  string,
  {
    userId: string;
    requestedPlatform: "FACEBOOK" | "INSTAGRAM";
    redirectAfter: string;
    origin: "dashboard" | "whatsapp";
    assets: MetaAsset[];
    expiresAt: number;
  }
>();

const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "business_management",
  "pages_manage_posts",
  "instagram_content_publish",
];

const getFrontendRedirectBase = () => env.appUrl ?? "http://localhost:3000";
const getMetaRedirectUri = () =>
  env.metaRedirectUri ?? `${env.backendPublicUrl ?? `http://localhost:${env.port}`}/api/social/meta/callback`;
const getSocialOAuthStateSecret = () => env.socialOAuthStateSecret ?? env.jwtSecret;

const encodeState = (payload: Record<string, unknown>) => {
  const json = JSON.stringify(payload);
  const base = Buffer.from(json, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSocialOAuthStateSecret()).update(base).digest("base64url");
  return `${base}.${sig}`;
};

const decodeState = (state: string) => {
  const [base, sig] = state.split(".");
  if (!base || !sig) {
    throw new Error("Invalid OAuth state");
  }

  const expected = crypto.createHmac("sha256", getSocialOAuthStateSecret()).update(base).digest("base64url");
  const sigBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error("Invalid OAuth state signature");
  }

  const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8")) as {
    userId: string;
    platform: "FACEBOOK" | "INSTAGRAM";
    origin: "dashboard" | "whatsapp";
    redirectAfter: string;
    nonce: string;
    exp: number;
  };

  if (Date.now() > payload.exp) {
    throw new Error("OAuth state expired");
  }

  return payload;
};

const buildDashboardRedirect = (params: Record<string, string>) => {
  const url = new URL("/dashboard", getFrontendRedirectBase());
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
};

const encryptToken = (value: string) => Buffer.from(value, "utf8").toString("base64");

const normalizeHandle = (value: string | null | undefined, fallback: string) => {
  const candidate = value?.trim().replace(/^@+/, "");
  if (candidate) return candidate;
  return fallback.replace(/^@+/, "").replace(/\s+/g, "_").toLowerCase();
};

const findConflict = async (userId: string, platform: "FACEBOOK" | "INSTAGRAM", externalPageId: string) =>
  prisma.socialAccount.findFirst({
    where: {
      platform,
      externalPageId,
      NOT: { userId },
    },
    select: { id: true, userId: true, handle: true, accountName: true },
  });

const upsertSocialAccount = async (userId: string, asset: MetaAsset) => {
  const conflict = await findConflict(userId, asset.platform, asset.id);
  if (conflict) {
    return {
      ok: false as const,
      conflict: {
        accountName: conflict.accountName ?? asset.accountName,
        handle: conflict.handle,
        platform: asset.platform,
      },
    };
  }

  const account = await prisma.socialAccount.upsert({
    where: {
      platform_externalPageId: {
        platform: asset.platform,
        externalPageId: asset.id,
      },
    },
    update: {
      handle: asset.handle,
      accountName: asset.accountName,
      provider: "meta",
      pageId: asset.pageId,
      pageName: asset.pageName,
      instagramBusinessId: asset.instagramBusinessId,
      accessTokenEncrypted: encryptToken(asset.accessToken),
      scopes: asset.scopes.join(","),
      metadataJson: asset.metadata,
    },
    create: {
      userId,
      platform: asset.platform,
      externalPageId: asset.id,
      handle: asset.handle,
      accountName: asset.accountName,
      provider: "meta",
      pageId: asset.pageId,
      pageName: asset.pageName,
      instagramBusinessId: asset.instagramBusinessId,
      accessTokenEncrypted: encryptToken(asset.accessToken),
      scopes: asset.scopes.join(","),
      metadataJson: asset.metadata,
    },
    select: {
      id: true,
      platform: true,
      handle: true,
      externalPageId: true,
      accountName: true,
      pageId: true,
      pageName: true,
      instagramBusinessId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { ok: true as const, account };
};

const exchangeMetaCodeForAccessToken = async (code: string) => {
  if (!env.metaAppId || !env.metaAppSecret) {
    throw new Error("Meta OAuth is not configured on the backend");
  }

  const url = new URL(`${env.metaGraphApiVersion}/oauth/access_token`, `https://graph.facebook.com/`);
  url.searchParams.set("client_id", env.metaAppId);
  url.searchParams.set("client_secret", env.metaAppSecret);
  url.searchParams.set("redirect_uri", getMetaRedirectUri());
  url.searchParams.set("code", code);

  const response = await fetch(url.toString());
  const body = (await response.json().catch(() => null)) as
    | { access_token?: string; token_type?: string; expires_in?: number; error?: { message?: string } }
    | null;

  if (!response.ok || !body?.access_token) {
    throw new Error(body?.error?.message ?? "Failed to exchange Meta OAuth code");
  }

  return body;
};

const fetchMetaAssets = async (accessToken: string): Promise<MetaAsset[]> => {
  const fields = ["id", "name", "access_token", "instagram_business_account{id,username,name}"].join(",");
  const url = new URL(`${env.metaGraphApiVersion}/me/accounts`, `https://graph.facebook.com/`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const body = (await response.json().catch(() => null)) as
    | {
        data?: Array<{
          id: string;
          name?: string;
          access_token?: string;
          instagram_business_account?: { id?: string; username?: string; name?: string };
        }>;
        error?: { message?: string };
      }
    | null;

  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Failed to fetch Meta pages");
  }

  const assets: MetaAsset[] = [];

  for (const page of body?.data ?? []) {
    const pageToken = page.access_token ?? accessToken;
    const pageName = page.name ?? "Facebook Page";

    assets.push({
      id: page.id,
      platform: "FACEBOOK",
      handle: normalizeHandle(page.name, page.id),
      accountName: pageName,
      pageId: page.id,
      pageName,
      instagramBusinessId: page.instagram_business_account?.id ?? null,
      accessToken: pageToken,
      scopes: META_SCOPES,
      metadata: JSON.stringify({
        source: "meta-oauth",
        pageId: page.id,
        pageName,
      }),
    });

    if (page.instagram_business_account?.id) {
      const ig = page.instagram_business_account;
      const igId = ig.id;
      if (!igId) {
        continue;
      }

      assets.push({
        id: igId,
        platform: "INSTAGRAM",
        handle: normalizeHandle(ig.username ?? ig.name ?? null, igId),
        accountName: ig.name ?? ig.username ?? pageName,
        pageId: page.id,
        pageName,
        instagramBusinessId: igId,
        accessToken: pageToken,
        scopes: META_SCOPES,
        metadata: JSON.stringify({
          source: "meta-oauth",
          pageId: page.id,
          pageName,
          instagramBusinessId: igId,
          instagramUsername: ig.username ?? null,
        }),
      });
    }
  }

  return assets;
};

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
      accountName: true,
      pageId: true,
      pageName: true,
      instagramBusinessId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.json({ accounts });
});

socialRouter.get("/meta/connect", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!env.metaAppId || !env.metaAppSecret) {
    return res.status(503).json({ message: "Meta OAuth is not configured yet" });
  }

  const parsed = metaConnectSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid Meta connect request",
      errors: z.flattenError(parsed.error),
    });
  }

  const redirectAfter = parsed.data.redirect?.startsWith("/") ? parsed.data.redirect : "/dashboard";
  const state = encodeState({
    userId,
    platform: parsed.data.platform,
    origin: parsed.data.origin,
    redirectAfter,
    nonce: crypto.randomUUID(),
    exp: Date.now() + 1000 * 60 * 15,
  });

  const metaUrl = new URL(`https://www.facebook.com/${env.metaGraphApiVersion}/dialog/oauth`);
  metaUrl.searchParams.set("client_id", env.metaAppId);
  metaUrl.searchParams.set("redirect_uri", getMetaRedirectUri());
  metaUrl.searchParams.set("state", state);
  metaUrl.searchParams.set("response_type", "code");
  metaUrl.searchParams.set("scope", META_SCOPES.join(","));

  return res.redirect(metaUrl.toString());
});

socialRouter.get("/meta/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const denied = typeof req.query.error === "string" ? req.query.error : null;

  if (denied) {
    return res.redirect(buildDashboardRedirect({ social: "cancelled", provider: "meta" }));
  }

  if (!code || !state) {
    return res.redirect(
      buildDashboardRedirect({ social: "error", provider: "meta", reason: "missing_callback_params" }),
    );
  }

  let decodedState: ReturnType<typeof decodeState>;
  try {
    decodedState = decodeState(state);
  } catch (error) {
    return res.redirect(
      buildDashboardRedirect({
        social: "error",
        provider: "meta",
        reason: error instanceof Error ? error.message : "invalid_state",
      }),
    );
  }

  try {
    const tokenResponse = await exchangeMetaCodeForAccessToken(code);
    const allAssets = await fetchMetaAssets(tokenResponse.access_token!);
    const assets = allAssets.filter((asset) => asset.platform === decodedState.platform);

    if (assets.length === 0) {
      return res.redirect(
        buildDashboardRedirect({ social: "no_assets", provider: "meta", platform: decodedState.platform }),
      );
    }

    if (assets.length === 1) {
      const asset = assets[0]!;
      const result = await upsertSocialAccount(decodedState.userId, asset);
      if (!result.ok) {
        return res.redirect(
          buildDashboardRedirect({
            social: "conflict",
            provider: "meta",
            platform: result.conflict.platform,
            account: result.conflict.accountName,
          }),
        );
      }

      return res.redirect(
        buildDashboardRedirect({
          social: "connected",
          provider: "meta",
          platform: asset.platform,
          account: asset.accountName,
        }),
      );
    }

    const sessionId = crypto.randomUUID();
    metaOAuthSessions.set(sessionId, {
      userId: decodedState.userId,
      requestedPlatform: decodedState.platform,
      redirectAfter: decodedState.redirectAfter,
      origin: decodedState.origin,
      assets,
      expiresAt: Date.now() + 1000 * 60 * 10,
    });

    return res.redirect(
      buildDashboardRedirect({
        social: "selection_required",
        provider: "meta",
        session: sessionId,
        platform: decodedState.platform,
      }),
    );
  } catch (error) {
    return res.redirect(
      buildDashboardRedirect({
        social: "error",
        provider: "meta",
        reason: error instanceof Error ? error.message : "oauth_failed",
      }),
    );
  }
});

socialRouter.get("/meta/assets", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const sessionId = typeof req.query.session === "string" ? req.query.session : "";
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const session = metaOAuthSessions.get(sessionId);
  if (!session || session.userId !== userId || session.expiresAt < Date.now()) {
    metaOAuthSessions.delete(sessionId);
    return res.status(404).json({ message: "Meta OAuth selection session not found or expired" });
  }

  return res.json({
    session: sessionId,
    requestedPlatform: session.requestedPlatform,
    assets: session.assets.map((asset) => ({
      id: asset.id,
      platform: asset.platform,
      handle: asset.handle,
      accountName: asset.accountName,
      pageId: asset.pageId,
      pageName: asset.pageName,
      instagramBusinessId: asset.instagramBusinessId,
    })),
  });
});

socialRouter.post("/meta/link", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const parsed = selectMetaAssetsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid Meta asset selection payload",
      errors: z.flattenError(parsed.error),
    });
  }

  const session = metaOAuthSessions.get(parsed.data.session);
  if (!session || session.userId !== userId || session.expiresAt < Date.now()) {
    metaOAuthSessions.delete(parsed.data.session);
    return res.status(404).json({ message: "Meta OAuth selection session not found or expired" });
  }

  const pickedAssets = session.assets.filter((asset) => parsed.data.assetIds.includes(asset.id));
  if (pickedAssets.length === 0) {
    return res.status(400).json({ message: "No valid Meta assets were selected" });
  }

  const createdAccounts = [];
  for (const asset of pickedAssets) {
    const result = await upsertSocialAccount(userId, asset);
    if (!result.ok) {
      return res.status(409).json({
        message: `The ${result.conflict.platform.toLowerCase()} account is already linked to another BrandqoAI profile.`,
        code: "ACCOUNT_CONFLICT",
        conflict: result.conflict,
      });
    }
    createdAccounts.push(result.account);
  }

  metaOAuthSessions.delete(parsed.data.session);

  return res.status(201).json({
    message: `Connected ${createdAccounts.length} social account${createdAccounts.length > 1 ? "s" : ""} successfully`,
    accounts: createdAccounts,
  });
});

socialRouter.get("/accounts/:id/impact", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const accountId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const account = await prisma.socialAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    return res.status(404).json({ message: "Social account not found" });
  }

  const affectedScheduledPosts = await prisma.scheduledPost.count({
    where: {
      platform: account.platform,
      postTemplate: {
        brand: {
          userId,
        },
        status: "SCHEDULED",
      },
      status: "PENDING",
    },
  });

  return res.json({
    account: {
      id: account.id,
      handle: account.handle,
      platform: account.platform,
    },
    affectedScheduledPosts,
  });
});

socialRouter.delete("/accounts/:id", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const accountId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const account = await prisma.socialAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    return res.status(404).json({ message: "Social account not found" });
  }

  const affectedScheduledPosts = await prisma.scheduledPost.count({
    where: {
      platform: account.platform,
      postTemplate: {
        brand: { userId },
        status: "SCHEDULED",
      },
      status: "PENDING",
    },
  });

  await prisma.socialAccount.delete({ where: { id: account.id } });

  return res.json({
    message:
      affectedScheduledPosts > 0
        ? `Social account disconnected. ${affectedScheduledPosts} pending scheduled post(s) may be affected.`
        : "Social account disconnected successfully.",
    affectedScheduledPosts,
  });
});

export { socialRouter };
