"use client";
// components/DashboardShell.tsx
import { type ReactNode } from "react";

interface DashboardShellProps {
  headerTitle: string;
  headerDescription: string;
  children: ReactNode;
}

export function DashboardShell({
  headerTitle,
  headerDescription,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-background/80 px-6 py-6 backdrop-blur lg:px-10">
        <div className="max-w-7xl">
          <p className="ml-10 mt-1.5 lg:m-0 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            BrandqoAI
          </p>
          <h2 className="lg:mt-2 mt-5 text-2xl font-heading font-semibold text-foreground lg:text-3xl">
            {headerTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground lg:text-base">
            {headerDescription}
          </p>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
