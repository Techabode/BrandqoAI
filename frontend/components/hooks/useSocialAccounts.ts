"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = "/api";
export type SocialPlatform = "INSTAGRAM" | "FACEBOOK" | "TWITTER";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  handle: string;
  externalPageId: string;
  accountName?: string | null;
  pageId?: string | null;
  pageName?: string | null;
  instagramBusinessId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetaSelectableAsset {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK";
  handle: string;
  accountName: string;
  pageId?: string | null;
  pageName?: string | null;
  instagramBusinessId?: string | null;
}

interface SocialAccountsResponse {
  accounts: SocialAccount[];
}

interface MetaAssetsResponse {
  session: string;
  requestedPlatform: "INSTAGRAM" | "FACEBOOK";
  assets: MetaSelectableAsset[];
}

const getFrontendQuery = () => new URLSearchParams(window.location.search);

export const useSocialAccounts = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [selectionSubmitting, setSelectionSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("INSTAGRAM");
  const [metaSelectionSession, setMetaSelectionSession] = useState<string | null>(null);
  const [metaSelectionAssets, setMetaSelectionAssets] = useState<MetaSelectableAsset[]>([]);
  const [selectedMetaAssetIds, setSelectedMetaAssetIds] = useState<string[]>([]);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/social/accounts`, {
        credentials: "include",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401) {
          throw new Error("Your session expired. Please log in again before connecting a social account.");
        }
        throw new Error(body?.message ?? "Failed to load social accounts");
      }

      const json = (await response.json()) as SocialAccountsResponse;
      setAccounts(json.accounts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load social accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetaSelectionSession = useCallback(async (session: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/meta/assets?session=${encodeURIComponent(session)}`, {
        credentials: "include",
      });

      const body = (await response.json().catch(() => null)) as
        | ({ message?: string } & Partial<MetaAssetsResponse>)
        | null;

      if (!response.ok || !body?.assets) {
        if (response.status === 401) {
          throw new Error("Your session expired. Please log in again before choosing a Meta account.");
        }
        throw new Error(body?.message ?? "Failed to load Meta account options");
      }

      setMetaSelectionSession(session);
      setMetaSelectionAssets(body.assets);
      setSelectedMetaAssetIds([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Meta account options");
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const params = getFrontendQuery();
    const socialStatus = params.get("social");
    const session = params.get("session");
    const account = params.get("account");
    const platform = params.get("platform");
    const reason = params.get("reason");

    if (!socialStatus) {
      return;
    }

    if (socialStatus === "connected") {
      setSuccessMessage(`${platform ?? "Social"} account connected${account ? `: ${account}` : ""}`);
      void fetchAccounts();
    } else if (socialStatus === "selection_required" && session) {
      void loadMetaSelectionSession(session);
    } else if (socialStatus === "conflict") {
      setError(account ? `${account} is already linked to another BrandqoAI profile.` : "This social account is already linked to another BrandqoAI profile.");
    } else if (socialStatus === "no_assets") {
      setError(`No eligible ${platform?.toLowerCase() ?? "social"} accounts were found in Meta.`);
    } else if (socialStatus === "cancelled") {
      setError("Meta OAuth was cancelled before the account could be connected.");
    } else if (socialStatus === "error") {
      setError(reason ? `Meta OAuth failed: ${reason}` : "Meta OAuth failed.");
    }

    const url = new URL(window.location.href);
    ["social", "provider", "platform", "session", "account", "reason"].forEach((key) => url.searchParams.delete(key));
    window.history.replaceState({}, "", url.toString());
  }, [fetchAccounts, loadMetaSelectionSession]);

  const startOAuthConnect = useCallback((platform: Extract<SocialPlatform, "INSTAGRAM" | "FACEBOOK">) => {
    setSubmitting(true);
    setSuccessMessage(null);
    setError(null);
    const url = new URL(`${window.location.origin}/api/social/meta/connect`);
    url.searchParams.set("platform", platform);
    url.searchParams.set("origin", "dashboard");
    url.searchParams.set("redirect", "/dashboard");
    window.location.href = url.toString();
  }, []);

  const getDisconnectImpact = useCallback(async (accountId: string) => {
    const response = await fetch(`${API_BASE_URL}/social/accounts/${accountId}/impact`, {
      credentials: "include",
    });

    const body = (await response.json().catch(() => null)) as { affectedScheduledPosts?: number; message?: string } | null;

    if (!response.ok) {
      throw new Error(body?.message ?? "Failed to inspect social account impact");
    }

    return body?.affectedScheduledPosts ?? 0;
  }, []);

  const disconnectAccount = useCallback(
    async (accountId: string) => {
      try {
        setDisconnecting(true);
        setSuccessMessage(null);
        const response = await fetch(`${API_BASE_URL}/social/accounts/${accountId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const body = (await response.json().catch(() => null)) as { message?: string } | null;

        if (!response.ok) {
          throw new Error(body?.message ?? "Failed to disconnect social account");
        }

        setSuccessMessage(body?.message ?? "Social account disconnected successfully");
        setError(null);
        await fetchAccounts();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to disconnect social account");
        return false;
      } finally {
        setDisconnecting(false);
      }
    },
    [fetchAccounts],
  );

  const toggleMetaAssetSelection = useCallback((assetId: string) => {
    setSelectedMetaAssetIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }, []);

  const confirmMetaAssetSelection = useCallback(async () => {
    if (!metaSelectionSession || selectedMetaAssetIds.length === 0) {
      return false;
    }

    try {
      setSelectionSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/social/meta/link`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: metaSelectionSession,
          assetIds: selectedMetaAssetIds,
        }),
      });

      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session expired. Please log in again before connecting Meta accounts.");
        }
        throw new Error(body?.message ?? "Failed to connect selected Meta accounts");
      }

      setSuccessMessage(body?.message ?? "Social account connected successfully");
      setError(null);
      setMetaSelectionSession(null);
      setMetaSelectionAssets([]);
      setSelectedMetaAssetIds([]);
      await fetchAccounts();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect selected Meta accounts");
      return false;
    } finally {
      setSelectionSubmitting(false);
      setSubmitting(false);
    }
  }, [fetchAccounts, metaSelectionSession, selectedMetaAssetIds]);

  const clearMetaSelection = useCallback(() => {
    setMetaSelectionSession(null);
    setMetaSelectionAssets([]);
    setSelectedMetaAssetIds([]);
  }, []);

  const connectedPlatforms = useMemo(() => new Set(accounts.map((account) => account.platform)), [accounts]);

  return {
    accounts,
    connectedPlatforms,
    loading,
    submitting,
    disconnecting,
    selectionSubmitting,
    error,
    successMessage,
    selectedPlatform,
    setSelectedPlatform,
    startOAuthConnect,
    getDisconnectImpact,
    disconnectAccount,
    metaSelectionSession,
    metaSelectionAssets,
    selectedMetaAssetIds,
    toggleMetaAssetSelection,
    confirmMetaAssetSelection,
    clearMetaSelection,
    refetch: fetchAccounts,
  };
};
