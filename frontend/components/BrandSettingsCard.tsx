"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Settings2 } from "lucide-react";
import { type BrandSettings } from "@/components/hooks/useBrandSettings";

interface BrandSettingsCardProps {
  brand: BrandSettings | null;
  loading: boolean;
  saving: boolean;
  regenerating: boolean;
  error: string | null;
  successMessage: string | null;
  onSave: (payload: {
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
  }) => Promise<boolean>;
  onRegenerate: () => Promise<boolean>;
}

export function BrandSettingsCard({
  brand,
  loading,
  saving,
  regenerating,
  error,
  successMessage,
  onSave,
  onRegenerate,
}: BrandSettingsCardProps) {
  const [form, setForm] = useState({
    brandName: "",
    industry: "",
    targetAudience: "",
    toneOfVoice: "",
    contentPillars: "",
    logoUrl: "",
    postingDaysPerWeek: "1",
    postsPerDay: "1",
    approvalMode: "MANUAL" as "MANUAL" | "AUTO_POST",
  });

  useEffect(() => {
    if (!brand) {
      return;
    }

    setForm({
      brandName: brand.brandName,
      industry: brand.industry ?? "",
      targetAudience: brand.targetAudience ?? "",
      toneOfVoice: brand.toneOfVoice ?? "",
      contentPillars: brand.contentPillars ?? "",
      logoUrl: brand.logoUrl ?? "",
      postingDaysPerWeek: String(brand.postingDaysPerWeek ?? 1),
      postsPerDay: String(brand.postsPerDay ?? 1),
      approvalMode: brand.approvalMode ?? "MANUAL",
    });
  }, [brand]);

  if (loading) {
    return <section className="card p-6">Loading brand settings…</section>;
  }

  if (!brand) {
    return <section className="card p-6">No brand profile found yet.</section>;
  }

  const handleSubmit = async () => {
    let pendingApprovalAction: "HOLD" | "AUTO_APPROVE" | undefined;

    if (brand.approvalMode === "MANUAL" && form.approvalMode === "AUTO_POST") {
      const autoApprove = window.confirm(
        "You are switching from manual approval to auto-post. Click OK to continue pending posts automatically, or Cancel to keep current pending posts waiting for manual review.",
      );
      pendingApprovalAction = autoApprove ? "AUTO_APPROVE" : "HOLD";
    }

    await onSave({
      brandName: form.brandName.trim(),
      industry: form.industry.trim() || undefined,
      targetAudience: form.targetAudience.trim() || undefined,
      toneOfVoice: form.toneOfVoice.trim() || undefined,
      contentPillars: form.contentPillars.trim() || undefined,
      logoUrl: form.logoUrl.trim() || undefined,
      postingDaysPerWeek: Number(form.postingDaysPerWeek),
      postsPerDay: Number(form.postsPerDay),
      approvalMode: form.approvalMode,
      pendingApprovalAction,
    });
  };

  return (
    <section className="card p-6 space-y-5">
      <div className="flex items-center gap-2 text-foreground">
        <Settings2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-heading font-semibold">Brand & content settings</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">Brand name</span>
          <input className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.brandName} onChange={(e) => setForm((prev) => ({ ...prev, brandName: e.target.value }))} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">Industry</span>
          <input className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.industry} onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))} />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="text-muted-foreground">Target audience</span>
          <input className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.targetAudience} onChange={(e) => setForm((prev) => ({ ...prev, targetAudience: e.target.value }))} />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="text-muted-foreground">Tone of voice</span>
          <input className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.toneOfVoice} onChange={(e) => setForm((prev) => ({ ...prev, toneOfVoice: e.target.value }))} />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="text-muted-foreground">Content pillars</span>
          <input className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.contentPillars} onChange={(e) => setForm((prev) => ({ ...prev, contentPillars: e.target.value }))} />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="text-muted-foreground">Logo URL</span>
          <input className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.logoUrl} onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">Posting days / week</span>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.postingDaysPerWeek} onChange={(e) => setForm((prev) => ({ ...prev, postingDaysPerWeek: e.target.value }))}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">Posts / day</span>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.postsPerDay} onChange={(e) => setForm((prev) => ({ ...prev, postsPerDay: e.target.value }))}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">Approval mode</span>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.approvalMode} onChange={(e) => setForm((prev) => ({ ...prev, approvalMode: e.target.value as "MANUAL" | "AUTO_POST" }))}>
            <option value="MANUAL">Manual approval</option>
            <option value="AUTO_POST">Auto-post</option>
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSubmit} disabled={saving || !form.brandName.trim()} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save settings
        </Button>
        <Button variant="outline" onClick={onRegenerate} disabled={regenerating} className="gap-2">
          {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Regenerate calendar
        </Button>
      </div>
    </section>
  );
}
