"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays, CheckCircle2, Clock3, Layers3, Link as LinkIcon, Loader2, LogOut, Moon, Pencil, Sparkles, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect, useMemo } from "react";
import { useAuthGuard } from "@/components/hooks/useAuthGuard";
import { DashboardEntry, useDashboardData } from "@/components/hooks/useDashboardData";

const platformStyles: Record<string, string> = {
  INSTAGRAM: "platform-instagram",
  FACEBOOK: "platform-facebook",
  TWITTER: "platform-twitter",
};

const statusStyles: Record<string, string> = {
  AWAITING_APPROVAL: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
  PENDING: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
  SENT: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-700 border border-red-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-700 border border-zinc-500/20",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatDayLabel = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const toLocalDateTimeInputValue = (value: string) => {
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

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
  const [mounted, setMounted] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DashboardEntry | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const { theme, setTheme } = useTheme();
  const { user, loading, handleLogout } = useAuthGuard();
  const {
    data,
    loading: dashboardLoading,
    error,
    pendingEntryId,
    updateEntry,
    approveEntry,
    deleteEntry,
  } = useDashboardData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleThemeHandler = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const groupedEntries = useMemo(() => {
    const entries = data?.entries ?? [];
    return entries.reduce<Record<string, typeof entries>>((acc, entry) => {
      const key = new Date(entry.scheduledTime).toISOString().slice(0, 10);
      acc[key] = acc[key] ? [...acc[key], entry] : [entry];
      return acc;
    }, {});
  }, [data?.entries]);

  const openEditModal = (entry: DashboardEntry) => {
    setEditingEntry(entry);
    setEditCaption(entry.caption);
    setEditScheduledTime(toLocalDateTimeInputValue(entry.scheduledTime));
  };

  const closeEditModal = () => {
    setEditingEntry(null);
    setEditCaption("");
    setEditScheduledTime("");
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editCaption.trim() || !editScheduledTime) {
      return;
    }

    const success = await updateEntry(editingEntry.id, {
      caption: editCaption.trim(),
      scheduledTime: new Date(editScheduledTime).toISOString(),
    });

    if (success) {
      closeEditModal();
    }
  };

  const handleDelete = async (entry: DashboardEntry) => {
    const confirmed = window.confirm(`Delete this scheduled post for ${entry.brandName}?`);
    if (!confirmed) return;
    await deleteEntry(entry.id);
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center animate-pulse">
          <div className="h-8 bg-muted w-64 mx-auto rounded mb-4"></div>
          <div className="text-muted-foreground">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold">BrandqoAI Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your live content calendar, brand snapshot, and next scheduled posts.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleThemeHandler}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-foreground">{user.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-foreground btn-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-6">
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

        <section className="card p-6 border border-dashed border-border">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground">
                <LinkIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-heading font-semibold">Social account connection</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                WhatsApp onboarding expects at least one connected social account before it can finish your posting frequency and approval setup.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                For now, the actual social account connection flow is still being implemented. If WhatsApp told you to connect an account here, that handoff is now clearer, but the full connect flow is not live yet.
              </p>
            </div>
            <Button variant="outline" className="gap-2" disabled>
              <LinkIcon className="h-4 w-4" />
              Connect social account (coming soon)
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 card p-6">
            <div className="flex items-center gap-3 mb-6">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">Content calendar</h2>
                <p className="text-sm text-muted-foreground">
                  Monthly scheduled posts with edit, approve, and delete controls.
                </p>
              </div>
            </div>

            {dashboardLoading ? (
              <p className="text-muted-foreground">Loading calendar…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : Object.keys(groupedEntries).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-muted-foreground">
                No scheduled posts yet. Generate a content calendar from WhatsApp or the backend first.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEntries)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([day, entries]) => (
                    <div key={day} className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {formatDayLabel(day)}
                      </h3>
                      <div className="space-y-3">
                        {entries.map((entry) => {
                          const isPending = pendingEntryId === entry.id;
                          return (
                            <div key={entry.id} className="rounded-xl border border-border p-4 bg-background/60">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-foreground">{entry.title}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{entry.brandName}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className={`rounded-full px-2 py-1 ${platformStyles[entry.platform] ?? "border border-border"}`}>
                                    {entry.platform}
                                  </span>
                                  <span className={`rounded-full px-2 py-1 ${statusStyles[entry.status] ?? "border border-border text-muted-foreground"}`}>
                                    {entry.status.replaceAll("_", " ")}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-3 text-sm leading-relaxed text-foreground/90 line-clamp-3">
                                {entry.caption}
                              </p>
                              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock3 className="h-3.5 w-3.5" />
                                <span>{formatDate(entry.scheduledTime)}</span>
                              </div>
                              {entry.errorMessage && (
                                <p className="mt-2 text-xs text-destructive">{entry.errorMessage}</p>
                              )}
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => openEditModal(entry)}
                                  disabled={isPending}
                                >
                                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                                  Edit
                                </Button>
                                {entry.status === "AWAITING_APPROVAL" && (
                                  <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => void approveEntry(entry.id)}
                                    disabled={isPending}
                                  >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Approve
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 text-destructive hover:text-destructive"
                                  onClick={() => void handleDelete(entry)}
                                  disabled={isPending}
                                >
                                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <section className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-5 w-5 text-accent" />
                <div>
                  <h2 className="text-xl font-heading font-semibold text-foreground">Next up</h2>
                  <p className="text-sm text-muted-foreground">Your next scheduled content at a glance.</p>
                </div>
              </div>

              <div className="space-y-3">
                {(data?.upcomingEntries ?? []).slice(0, 4).map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{entry.title}</p>
                      <span className={`rounded-full px-2 py-1 text-xs ${platformStyles[entry.platform] ?? "border border-border"}`}>
                        {entry.platform}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(entry.scheduledTime)}</p>
                  </div>
                ))}

                {(data?.upcomingEntries?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">No upcoming scheduled posts yet.</p>
                )}
              </div>
            </section>

            <section className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Layers3 className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-heading font-semibold text-foreground">Brand profile</h2>
                  <p className="text-sm text-muted-foreground">The first configured brand in your workspace.</p>
                </div>
              </div>

              {data?.brands?.[0] ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Brand</p>
                    <p className="font-medium text-foreground">{data.brands[0].brandName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Industry</p>
                    <p className="text-foreground">{data.brands[0].industry ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target audience</p>
                    <p className="text-foreground">{data.brands[0].targetAudience ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tone</p>
                    <p className="text-foreground">{data.brands[0].toneOfVoice ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Content pillars</p>
                    <p className="text-foreground">{data.brands[0].contentPillars ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Approval mode</p>
                    <p className="text-foreground">{data.brands[0].approvalMode ?? "Not set"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No brand profile found yet.</p>
              )}
            </section>
          </section>
        </section>
      </main>

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Edit scheduled post</h2>
                <p className="text-sm text-muted-foreground">Update the caption or scheduled time for this calendar entry.</p>
              </div>
              <Button variant="outline" size="sm" onClick={closeEditModal}>
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Caption</label>
                <textarea
                  value={editCaption}
                  onChange={(event) => setEditCaption(event.target.value)}
                  className="min-h-40 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Scheduled time</label>
                <input
                  type="datetime-local"
                  value={editScheduledTime}
                  onChange={(event) => setEditScheduledTime(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
              <Button onClick={() => void handleSaveEdit()} disabled={pendingEntryId === editingEntry.id}>
                {pendingEntryId === editingEntry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
