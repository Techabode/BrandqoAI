"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://backend-production-62761.up.railway.app";

export type SocialPlatform = "INSTAGRAM" | "FACEBOOK" | "TWITTER";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  handle: string;
  externalPageId: string;
  createdAt: string;
  updatedAt: string;
}

interface SocialAccountsResponse {
  accounts: SocialAccount[];
}

export const useSocialAccounts = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("INSTAGRAM");
  const [socialHandle, setSocialHandle] = useState("");

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/social/accounts`, {
        credentials: "include",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
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

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const connectAccount = useCallback(
    async (payload: { platform: SocialPlatform; handle: string }) => {
      try {
        setSubmitting(true);
        setSuccessMessage(null);
        const response = await fetch(`${API_BASE_URL}/api/social/accounts`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const body = (await response.json().catch(() => null)) as { message?: string } | null;

        if (!response.ok) {
          throw new Error(body?.message ?? "Failed to connect social account");
        }

        setSuccessMessage(body?.message ?? "Social account connected successfully");
        setError(null);
        await fetchAccounts();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect social account");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchAccounts],
  );

  const disconnectAccount = useCallback(
    async (accountId: string) => {
      try {
        setDisconnecting(true);
        setSuccessMessage(null);
        const response = await fetch(`${API_BASE_URL}/api/social/accounts/${accountId}`, {
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

  return {
    accounts,
    loading,
    submitting,
    disconnecting,
    error,
    successMessage,
    selectedPlatform,
    setSelectedPlatform,
    socialHandle,
    setSocialHandle,
    connectAccount,
    disconnectAccount,
    refetch: fetchAccounts,
  };
};
