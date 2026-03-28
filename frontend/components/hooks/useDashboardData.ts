"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface DashboardBrand {
  id: string;
  brandName: string;
  industry: string | null;
  targetAudience: string | null;
  toneOfVoice: string | null;
  contentPillars: string | null;
  postingFrequency: string | null;
  approvalMode: "MANUAL" | "AUTO_POST" | null;
}

export interface DashboardEntry {
  id: string;
  postTemplateId: string;
  brandId: string;
  brandName: string;
  title: string;
  caption: string;
  imagePrompt: string | null;
  imageUrl: string | null;
  platform: "INSTAGRAM" | "FACEBOOK" | "TWITTER";
  status: "PENDING" | "SENT" | "FAILED" | "CANCELLED" | "AWAITING_APPROVAL";
  rawStatus: "PENDING" | "SENT" | "FAILED" | "CANCELLED";
  approvalMode: "MANUAL" | "AUTO_POST" | null;
  scheduledTime: string;
  errorMessage: string | null;
  postingFrequency: string | null;
}

interface DashboardResponse {
  brands: DashboardBrand[];
  summary: {
    totalBrands: number;
    totalScheduledPosts: number;
    upcomingCount: number;
  };
  upcomingEntries: DashboardEntry[];
  entries: DashboardEntry[];
}

interface UpdateDashboardEntryInput {
  caption?: string;
  scheduledTime?: string;
  imagePrompt?: string | null;
  imageUrl?: string | null;
}

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/content/calendar?month=${getCurrentMonth()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const json = (await response.json()) as DashboardResponse;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const updateEntry = useCallback(async (entryId: string, payload: UpdateDashboardEntryInput) => {
    try {
      setPendingEntryId(entryId);
      const response = await fetch(`${API_BASE_URL}/api/content/calendar/${entryId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update calendar entry");
      }

      await fetchDashboard();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update calendar entry");
      return false;
    } finally {
      setPendingEntryId(null);
    }
  }, [fetchDashboard]);

  const approveEntry = useCallback(async (entryId: string) => {
    try {
      setPendingEntryId(entryId);
      const response = await fetch(`${API_BASE_URL}/api/content/calendar/${entryId}/approve`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to approve calendar entry");
      }

      await fetchDashboard();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve calendar entry");
      return false;
    } finally {
      setPendingEntryId(null);
    }
  }, [fetchDashboard]);

  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      setPendingEntryId(entryId);
      const response = await fetch(`${API_BASE_URL}/api/content/calendar/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to delete calendar entry");
      }

      await fetchDashboard();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete calendar entry");
      return false;
    } finally {
      setPendingEntryId(null);
    }
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    pendingEntryId,
    refetch: fetchDashboard,
    updateEntry,
    approveEntry,
    deleteEntry,
  };
};
