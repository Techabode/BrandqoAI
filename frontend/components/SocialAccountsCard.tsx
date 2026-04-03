"use client";

import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Loader2, Trash2 } from "lucide-react";
import { type SocialPlatform, useSocialAccounts } from "@/components/hooks/useSocialAccounts";

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
    error,
    successMessage,
    selectedPlatform,
    setSelectedPlatform,
    socialHandle,
    setSocialHandle,
    connectAccount,
    disconnectAccount,
  } = useSocialAccounts();

  const handleConnect = async () => {
    if (!socialHandle.trim()) return;
    const success = await connectAccount({ platform: selectedPlatform, handle: socialHandle.trim() });
    if (success) {
      setSocialHandle("");
    }
  };

  const handleDisconnect = async (accountId: string, handle: string) => {
    const confirmed = window.confirm(`Disconnect @${handle}? Scheduled posts may be affected.`);
    if (!confirmed) return;
    await disconnectAccount(accountId);
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
            WhatsApp onboarding expects at least one connected social account before it can finish your posting frequency and approval setup.
          </p>
        </div>
        <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {accounts.length > 0 ? `${accounts.length} account${accounts.length > 1 ? "s" : ""} connected` : "No accounts connected yet"}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
        <select
          value={selectedPlatform}
          onChange={(event) => setSelectedPlatform(event.target.value as SocialPlatform)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="INSTAGRAM">Instagram</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="TWITTER">X / Twitter</option>
        </select>

        <input
          value={socialHandle}
          onChange={(event) => setSocialHandle(event.target.value)}
          placeholder="Enter handle e.g. brandqoofficial"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />

        <Button variant="outline" className="gap-2" onClick={handleConnect} disabled={submitting || !socialHandle.trim()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
          Connect social account
        </Button>
      </div>

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
              <p className="mt-3 text-sm font-medium text-foreground">@{account.handle}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ref: {account.externalPageId}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
