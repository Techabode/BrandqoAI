"use client";
// app/(auth)/brand-summary/page.tsx
import { Layers3 } from "lucide-react";
import { useAuthGuard } from "@/components/hooks/useAuthGuard";
import { useDashboardData } from "@/components/hooks/useDashboardData";
import { DashboardShell } from "@/components/DashboardShell";

export default function BrandSummaryPage() {
  const { user, loading } = useAuthGuard();
  const { data } = useDashboardData();

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
      headerTitle="Brand summary"
      headerDescription="Current snapshot of your primary brand and posting setup."
    >
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Layers3 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-heading font-semibold text-foreground">Brand summary</h2>
            <p className="text-sm text-muted-foreground">
              Current snapshot of your primary brand and posting setup.
            </p>
          </div>
        </div>

        {data?.brands?.[0] ? (
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            {(
              [
                ["Brand",               data.brands[0].brandName],
                ["Industry",            data.brands[0].industry          ?? "Not set"],
                ["Target audience",     data.brands[0].targetAudience    ?? "Not set"],
                ["Tone",                data.brands[0].toneOfVoice       ?? "Not set"],
                ["Content pillars",     data.brands[0].contentPillars    ?? "Not set"],
                ["Approval mode",       data.brands[0].approvalMode      ?? "Not set"],
                ["Posting days / week", String(data.brands[0].postingDaysPerWeek ?? "Not set")],
                ["Posts / day",         String(data.brands[0].postsPerDay        ?? "Not set")],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No brand profile found yet.</p>
        )}
      </section>
    </DashboardShell>
  );
}
