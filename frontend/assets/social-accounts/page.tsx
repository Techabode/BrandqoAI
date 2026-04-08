"use client";
// app/(auth)/social-accounts/page.tsx
import { useAuthGuard } from "@/components/hooks/useAuthGuard";
import { SocialAccountsCard } from "@/components/SocialAccountsCard";
import { DashboardShell } from "@/components/DashboardShell";

export default function SocialAccountsPage() {
  const { user, loading } = useAuthGuard();

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
      headerTitle="Social accounts"
      headerDescription="Connect and manage your social media platforms for publishing."
    >
      <SocialAccountsCard />
    </DashboardShell>
  );
}
