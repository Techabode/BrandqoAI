"use client";
// app/(auth)/dashboard/page.tsx
import { Layers3, Sparkles } from "lucide-react";
import { useAuthGuard } from "@/components/hooks/useAuthGuard";
import { useDashboardData } from "@/components/hooks/useDashboardData";
import { useBrandSettings } from "@/components/hooks/useBrandSettings";
import { BrandSettingsCard } from "@/components/BrandSettingsCard";
import { DashboardShell } from "@/components/DashboardShell";

const platformStyles: Record<string, string> = {
  INSTAGRAM: "platform-instagram",
  FACEBOOK: "platform-facebook",
  TWITTER: "platform-twitter",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const StatCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) => (
  <div className="card p-6">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
    <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
  </div>
);

export default function DashboardPage() {
  const { user, loading } = useAuthGuard();
  const { data } = useDashboardData();
  const {
    primaryBrand,
    loading: brandSettingsLoading,
    saving: brandSettingsSaving,
    regenerating: brandSettingsRegenerating,
    error: brandSettingsError,
    successMessage: brandSettingsSuccess,
    updateBrandSettings,
    regenerateCalendar,
  } = useBrandSettings();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="glass-card p-8 text-center animate-pulse">
          <div className="h-8 bg-muted w-64 mx-auto rounded mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardShell
      headerTitle="Business dashboard"
      headerDescription="Manage your brand, calendar, social accounts, and publishing preferences from one proper control panel."
    >
      <div className="space-y-6">
        {/* Stat cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Brands"
            value={data?.summary.totalBrands ?? 0}
            subtitle="Profiles currently available in your workspace."
          />
          <StatCard
            title="Scheduled posts"
            value={data?.summary.totalScheduledPosts ?? 0}
            subtitle="All posts currently stored this month in your calendar."
          />
          <StatCard
            title="Upcoming"
            value={data?.summary.upcomingCount ?? 0}
            subtitle="Posts still waiting to be published."
          />
        </section>

        {/* Main content grid */}
        <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <BrandSettingsCard
            brand={primaryBrand}
            loading={brandSettingsLoading}
            saving={brandSettingsSaving}
            regenerating={brandSettingsRegenerating}
            error={brandSettingsError}
            successMessage={brandSettingsSuccess}
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

          <section className="space-y-6">
            {/* Next up */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-5 w-5 text-accent" />
                <div>
                  <h2 className="text-xl font-heading font-semibold text-foreground">
                    Next up
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your next scheduled content at a glance.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {(data?.upcomingEntries ?? []).slice(0, 4).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {entry.title}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          platformStyles[entry.platform] ??
                          "border border-border"
                        }`}
                      >
                        {entry.platform}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(entry.scheduledTime)}
                    </p>
                  </div>
                ))}
                {(data?.upcomingEntries?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No upcoming scheduled posts yet.
                  </p>
                )}
              </div>
            </div>

            {/* Brand snapshot */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Layers3 className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-heading font-semibold text-foreground">
                    Brand summary
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Quick snapshot of your primary brand.
                  </p>
                </div>
              </div>
              {data?.brands?.[0] ? (
                <div className="space-y-3 text-sm">
                  {(
                    [
                      ["Brand", data.brands[0].brandName],
                      ["Industry", data.brands[0].industry ?? "Not set"],
                      [
                        "Target audience",
                        data.brands[0].targetAudience ?? "Not set",
                      ],
                      ["Tone", data.brands[0].toneOfVoice ?? "Not set"],
                      [
                        "Content pillars",
                        data.brands[0].contentPillars ?? "Not set",
                      ],
                      [
                        "Approval mode",
                        data.brands[0].approvalMode ?? "Not set",
                      ],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-muted-foreground">{label}</p>
                      <p className="font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No brand profile found yet.
                </p>
              )}
            </div>
          </section>
        </section>
      </div>
    </DashboardShell>
  );
}
