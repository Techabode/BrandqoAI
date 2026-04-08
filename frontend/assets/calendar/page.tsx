"use client";
// app/(auth)/calendar/page.tsx
import { CalendarDays, CheckCircle2, Clock3, Loader2, Pencil, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuthGuard } from "@/components/hooks/useAuthGuard";
import { useDashboardData } from "@/components/hooks/useDashboardData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { DashboardEntry } from "@/types/dashboard";

const platformStyles: Record<string, string> = {
  INSTAGRAM: "platform-instagram",
  FACEBOOK:  "platform-facebook",
  TWITTER:   "platform-twitter",
};

const statusStyles: Record<string, string> = {
  AWAITING_APPROVAL: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
  PENDING:           "bg-blue-500/10 text-blue-700 border border-blue-500/20",
  SENT:              "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  FAILED:            "bg-red-500/10 text-red-700 border border-red-500/20",
  CANCELLED:         "bg-zinc-500/10 text-zinc-700 border border-zinc-500/20",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    hour:    "numeric",
    minute:  "2-digit",
  }).format(new Date(value));

const formatDayLabel = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  }).format(new Date(value));

const toLocalDateTimeInputValue = (value: string) => {
  const d = new Date(value);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function CalendarPage() {
  const [editingEntry, setEditingEntry] = useState<DashboardEntry | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editScheduledTime, setEditScheduledTime] = useState("");

  const { user, loading } = useAuthGuard();
  const {
    data,
    loading: dashboardLoading,
    error,
    pendingEntryId,
    updateEntry,
    approveEntry,
    deleteEntry,
  } = useDashboardData();

  const groupedEntries = useMemo(() => {
    return (data?.entries ?? []).reduce<Record<string, DashboardEntry[]>>((acc, entry) => {
      const key = new Date(entry.scheduledTime).toISOString().slice(0, 10);
      acc[key] = acc[key] ? [...acc[key], entry] : [entry];
      return acc;
    }, {});
  }, [data?.entries]);

  const openEdit = (entry: DashboardEntry) => {
    setEditingEntry(entry);
    setEditCaption(entry.caption);
    setEditScheduledTime(toLocalDateTimeInputValue(entry.scheduledTime));
  };

  const closeEdit = () => {
    setEditingEntry(null);
    setEditCaption("");
    setEditScheduledTime("");
  };

  const handleSave = async () => {
    if (!editingEntry || !editCaption.trim() || !editScheduledTime) return;
    const ok = await updateEntry(editingEntry.id, {
      caption:       editCaption.trim(),
      scheduledTime: new Date(editScheduledTime).toISOString(),
    });
    if (ok) closeEdit();
  };

  const handleDelete = async (entry: DashboardEntry) => {
    if (!window.confirm(`Delete this scheduled post for ${entry.brandName}?`)) return;
    await deleteEntry(entry.id);
  };

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
    <>
      <DashboardShell
        headerTitle="Content calendar"
        headerDescription="Scheduled posts with edit, approve, and delete controls."
      >
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Content calendar
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage every entry in your publishing schedule.
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
                          <div
                            key={entry.id}
                            className="rounded-xl border border-border p-4 bg-background/60"
                          >
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
                                onClick={() => openEdit(entry)}
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
      </DashboardShell>

      <Dialog
        open={!!editingEntry}
        onClose={closeEdit}
        title="Edit scheduled post"
        description="Update the caption or scheduled time for this calendar entry."
        footer={
          <>
            <Button variant="outline" onClick={closeEdit}>Cancel</Button>
            <Button
              onClick={() => void handleSave()}
              disabled={!editingEntry || pendingEntryId === editingEntry?.id}
            >
              {pendingEntryId === editingEntry?.id && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Caption</label>
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="min-h-40 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Scheduled time</label>
            <input
              type="datetime-local"
              value={editScheduledTime}
              onChange={(e) => setEditScheduledTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
