"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Facebook, Instagram, Link as LinkIcon, Loader2, Trash2 } from "lucide-react";
import { useSocialAccounts } from "@/components/hooks/useSocialAccounts";

const platformStyles: Record<string, string> = {
  INSTAGRAM: "platform-instagram",
  FACEBOOK: "platform-facebook",
  TWITTER: "platform-twitter",
};

export function SocialAccountsCard() {
  const {
    accounts,
    loading,
    submitting,
    disconnecting,
    selectionSubmitting,
    error,
    successMessage,
    startOAuthConnect,
    getDisconnectImpact,
    disconnectAccount,
    metaSelectionSession,
    metaSelectionAssets,
    selectedMetaAssetIds,
    toggleMetaAssetSelection,
    confirmMetaAssetSelection,
    clearMetaSelection,
  } = useSocialAccounts();

  const handleDisconnect = async (accountId: string, handle: string) => {
    try {
      const affectedScheduledPosts = await getDisconnectImpact(accountId);
      const confirmed = window.confirm(
        affectedScheduledPosts > 0
          ? `Disconnect @${handle}? ${affectedScheduledPosts} pending scheduled post(s) may be affected.`
          : `Disconnect @${handle}?`,
      );
      if (!confirmed) return;
      await disconnectAccount(accountId);
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Failed to inspect disconnect impact.");
    }
  };

  return (
    <section className="card p-6 border border-dashed border-border space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-foreground">
            <LinkIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-heading font-semibold">Social account connection</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your real Meta accounts here. At least one connected social account is required before BrandqoAI can finish the proper posting flow.
          </p>
        </div>
        <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {accounts.length > 0 ? `${accounts.length} account${accounts.length > 1 ? "s" : ""} connected` : "No accounts connected yet"}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Button variant="outline" className="justify-start gap-2" onClick={() => startOAuthConnect("FACEBOOK")} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-4 w-4" />}
          Connect Facebook Page via Meta OAuth
        </Button>
        <Button variant="outline" className="justify-start gap-2" onClick={() => startOAuthConnect("INSTAGRAM")} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
          Connect Instagram Business via Meta OAuth
        </Button>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <p>
            This now uses a browser handoff through Meta. If an account is already claimed by another BrandqoAI profile, the connection is blocked instead of quietly stomping over it. Miracles do happen.
          </p>
        </div>
      </div>

      {metaSelectionSession ? (
        <div className="space-y-4 rounded-2xl border border-border bg-background/60 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Choose which Meta account(s) to link</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We found more than one eligible account. Pick the ones BrandqoAI should connect.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {metaSelectionAssets.map((asset) => {
              const checked = selectedMetaAssetIds.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleMetaAssetSelection(asset.id)}
                  className={`rounded-xl border p-4 text-left transition ${checked ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${platformStyles[asset.platform] ?? "bg-muted text-foreground"}`}>
                      {asset.platform === "FACEBOOK" ? "Facebook" : "Instagram"}
                    </span>
                    {checked ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">{asset.accountName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">@{asset.handle}</p>
                  {asset.pageName ? <p className="mt-1 text-xs text-muted-foreground">Page: {asset.pageName}</p> : null}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void confirmMetaAssetSelection()} disabled={selectionSubmitting || selectedMetaAssetIds.length === 0}>
              {selectionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Connect selected account{selectedMetaAssetIds.length === 1 ? "" : "s"}
            </Button>
            <Button variant="outline" onClick={clearMetaSelection} disabled={selectionSubmitting}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading connected social accounts…</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No social accounts connected yet.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${platformStyles[account.platform] ?? "bg-muted text-foreground"}`}>
                  {account.platform === "TWITTER" ? "X / Twitter" : account.platform}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDisconnect(account.id, account.handle)} disabled={disconnecting}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{account.accountName ?? `@${account.handle}`}</p>
              <p className="mt-1 text-xs text-muted-foreground">@{account.handle}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ref: {account.externalPageId}</p>
              {account.pageName ? <p className="mt-1 text-xs text-muted-foreground">Page: {account.pageName}</p> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
