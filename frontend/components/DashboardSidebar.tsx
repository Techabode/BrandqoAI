"use client";

import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  LayoutDashboard,
  Layers3,
  Link as LinkIcon,
  LogOut,
  Menu,
  Moon,
  Settings2,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

export type DashboardSectionKey =
  | "overview"
  | "calendar"
  | "upcoming"
  | "brand-settings"
  | "social-accounts"
  | "brand-summary";

const navItems: Array<{
  key: DashboardSectionKey;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "upcoming", label: "Upcoming", icon: Sparkles },
  { key: "brand-settings", label: "Settings", icon: Settings2 },
  { key: "social-accounts", label: "Social accounts", icon: LinkIcon },
  { key: "brand-summary", label: "Brand summary", icon: Layers3 },
];

interface DashboardSidebarProps {
  activeSection: DashboardSectionKey;
  onNavigate: (section: DashboardSectionKey) => void;
  userName?: string | null;
  userEmail: string;
  onLogout: () => void | Promise<void>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function DashboardSidebar({
  activeSection,
  onNavigate,
  userName,
  userEmail,
  onLogout,
  mobileOpen,
  setMobileOpen,
}: DashboardSidebarProps) {
  const { theme, setTheme } = useTheme();

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-border bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">BrandqoAI</p>
          <h1 className="text-lg font-semibold text-foreground">Business dashboard</h1>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b border-border px-4 py-4 lg:px-6">
        <p className="text-sm font-medium text-foreground">{userName ?? "User"}</p>
        <p className="text-xs text-muted-foreground">{userEmail}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 lg:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeSection;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onNavigate(item.key);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border px-4 py-4 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-2"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          Toggle theme
        </Button>
        <Button variant="outline" size="sm" onClick={onLogout} className="w-full justify-start gap-2 text-destructive">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block lg:w-72 lg:flex-shrink-0">{sidebarContent}</div>

      <div className="lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-4 z-40"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <div className="h-full w-80 max-w-[85vw]" onClick={(event) => event.stopPropagation()}>
              {sidebarContent}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
