"use client";

import { type ReactNode } from "react";
import { DashboardSectionKey, DashboardSidebar } from "@/components/DashboardSidebar";

interface DashboardShellProps {
  activeSection: DashboardSectionKey;
  onNavigate: (section: DashboardSectionKey) => void;
  userName?: string | null;
  userEmail: string;
  onLogout: () => void | Promise<void>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  headerTitle: string;
  headerDescription: string;
  children: ReactNode;
}

export function DashboardShell({
  activeSection,
  onNavigate,
  userName,
  userEmail,
  onLogout,
  mobileOpen,
  setMobileOpen,
  headerTitle,
  headerDescription,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <DashboardSidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-border bg-background/80 px-6 py-6 backdrop-blur lg:px-10">
          <div className="max-w-7xl">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">BrandqoAI</p>
            <h2 className="mt-2 text-2xl font-heading font-semibold text-foreground lg:text-3xl">{headerTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground lg:text-base">{headerDescription}</p>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
