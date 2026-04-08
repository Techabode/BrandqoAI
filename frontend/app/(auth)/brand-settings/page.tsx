"use client";
// app/(auth)/brand-settings/page.tsx
import { useAuthGuard } from "@/components/hooks/useAuthGuard";
import { useBrandSettings } from "@/components/hooks/useBrandSettings";
import { BrandSettingsCard } from "@/components/BrandSettingsCard";
import { DashboardShell } from "@/components/DashboardShell";

export default function BrandSettingsPage() {
  const { user, loading } = useAuthGuard();
  const {
    primaryBrand,
    loading: brandSettingsLoading,
    saving,
    regenerating,
    error,
    successMessage,
    updateBrandSettings,
    regenerateCalendar,
  } = useBrandSettings();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="glass-card p-8 text-center animate-pulse">
          <div className="h-8 bg-muted w-64 mx-auto rounded mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardShell
      headerTitle="Brand settings"
      headerDescription="Configure your brand identity, tone of voice, and content preferences."
    >
      <BrandSettingsCard
        brand={primaryBrand}
        loading={brandSettingsLoading}
        saving={saving}
        regenerating={regenerating}
        error={error}
        successMessage={successMessage}
        onSave={(payload) =>
          primaryBrand
            ? updateBrandSettings(primaryBrand.id, payload)
            : Promise.resolve(false)
        }
        onRegenerate={() =>
          primaryBrand
            ? regenerateCalendar(primaryBrand.id)
            : Promise.resolve(false)
        }
      />
    </DashboardShell>
  );
}
