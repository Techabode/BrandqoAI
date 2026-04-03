"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://backend-production-62761.up.railway.app";

export interface BrandSettings {
  id: string;
  brandName: string;
  industry: string | null;
  targetAudience: string | null;
  toneOfVoice: string | null;
  contentPillars: string | null;
  logoUrl: string | null;
  postingDaysPerWeek: number | null;
  postsPerDay: number | null;
  approvalMode: "MANUAL" | "AUTO_POST" | null;
}

interface BrandResponse {
  brands: Array<{
    id: string;
    brandName: string;
    industry: string | null;
    targetAudience: string | null;
    toneOfVoice: string | null;
    contentPillars: string | null;
    logoUrl: string | null;
    preferences?: {
      postingDaysPerWeek: number | null;
      postsPerDay: number | null;
      approvalMode: "MANUAL" | "AUTO_POST" | null;
    } | null;
  }>;
}

export const useBrandSettings = () => {
  const [brands, setBrands] = useState<BrandSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/brand`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch brand settings");
      }

      const json = (await response.json()) as BrandResponse;
      setBrands(
        json.brands.map((brand) => ({
          id: brand.id,
          brandName: brand.brandName,
          industry: brand.industry,
          targetAudience: brand.targetAudience,
          toneOfVoice: brand.toneOfVoice,
          contentPillars: brand.contentPillars,
          logoUrl: brand.logoUrl,
          postingDaysPerWeek: brand.preferences?.postingDaysPerWeek ?? null,
          postsPerDay: brand.preferences?.postsPerDay ?? null,
          approvalMode: brand.preferences?.approvalMode ?? null,
        })),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch brand settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBrands();
  }, [fetchBrands]);

  const primaryBrand = useMemo(() => brands[0] ?? null, [brands]);

  const updateBrandSettings = useCallback(
    async (
      brandId: string,
      payload: {
        brandName: string;
        industry?: string;
        targetAudience?: string;
        toneOfVoice?: string;
        contentPillars?: string;
        logoUrl?: string;
        postingDaysPerWeek?: number;
        postsPerDay?: number;
        approvalMode?: "MANUAL" | "AUTO_POST";
        pendingApprovalAction?: "HOLD" | "AUTO_APPROVE";
      },
    ) => {
      try {
        setSaving(true);
        setSuccessMessage(null);
        const response = await fetch(`${API_BASE_URL}/api/brand/${brandId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const body = (await response.json().catch(() => null)) as {
          error?: string;
          message?: string;
          pendingTemplatesNeedingRefresh?: number;
          brandIdentityChanged?: boolean;
        } | null;

        if (!response.ok) {
          throw new Error(body?.error ?? body?.message ?? "Failed to update brand settings");
        }

        setSuccessMessage(
          body?.message ??
            (body?.brandIdentityChanged && (body?.pendingTemplatesNeedingRefresh ?? 0) > 0
              ? `${body.pendingTemplatesNeedingRefresh} scheduled post template(s) may need flyer regeneration to reflect your latest brand identity.`
              : "Brand settings updated successfully."),
        );
        setError(null);
        await fetchBrands();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update brand settings");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchBrands],
  );

  const regenerateCalendar = useCallback(
    async (brandId: string) => {
      try {
        setRegenerating(true);
        setSuccessMessage(null);
        const response = await fetch(`${API_BASE_URL}/api/content/calendar/generate`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId }),
        });

        const body = (await response.json().catch(() => null)) as { error?: string } | null;

        if (!response.ok) {
          throw new Error(body?.error ?? "Failed to regenerate calendar");
        }

        setSuccessMessage("Calendar regeneration started successfully.");
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to regenerate calendar");
        return false;
      } finally {
        setRegenerating(false);
      }
    },
    [],
  );

  return {
    brands,
    primaryBrand,
    loading,
    saving,
    regenerating,
    error,
    successMessage,
    refetch: fetchBrands,
    updateBrandSettings,
    regenerateCalendar,
  };
};
