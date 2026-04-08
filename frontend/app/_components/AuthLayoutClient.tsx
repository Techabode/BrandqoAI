"use client";
// app/(auth)/_components/AuthLayoutClient.tsx
import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { type ReactNode } from "react";

interface AuthLayoutClientProps {
  children: ReactNode;
}

export function AuthLayoutClient({ children }: AuthLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Page content fills remaining space */}
      <div className="flex min-h-screen flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
