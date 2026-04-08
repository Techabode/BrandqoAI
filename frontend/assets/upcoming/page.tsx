"use client";
// app/(auth)/upcoming/page.tsx
import { Sparkles } from "lucide-react";
import { useAuthGuard } from "@/components/hooks/useAuthGuard";
import { useDashboardData } from "@/components/hooks/useDashboardData";
import { DashboardShell } from "@/components/DashboardShell";

const platformStyles: Record<string, string> = {
  INSTAGRAM: "platform-instagram",
  FACEBOOK:  "platform-facebook",
  TWITTER:   "platform-twitter",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    hour:    "numeric",
    minute:  "2-digit",
  }).format(new Date(value));

export default function UpcomingPage() {
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
      headerTitle="Upcoming posts"
      headerDescription="Your next scheduled content queue."
    >
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-accent" />
          <div>
            <h2 className="text-xl font-heading font-semibold text-foreground">Upcoming posts</h2>
            <p className="text-sm text-muted-foreground">Your next scheduled content queue.</p>
          </div>
        </div>

        <div className="space-y-3">
          {(data?.upcomingEntries ?? []).map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.brandName}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${platformStyles[entry.platform] ?? "border border-border"}`}>
                  {entry.platform}
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{entry.caption}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(entry.scheduledTime)}</p>
            </div>
          ))}

          {(data?.upcomingEntries?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming scheduled posts yet.</p>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
