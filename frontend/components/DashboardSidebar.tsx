"use client";
// components/DashboardSidebar.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthGuard } from "./hooks/useAuthGuard";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Upcoming", href: "/upcoming", icon: Sparkles },
  { label: "Settings", href: "/brand-settings", icon: Settings2 },
  { label: "Social accounts", href: "/social-accounts", icon: LinkIcon },
  { label: "Brand summary", href: "/brand-summary", icon: Layers3 },
];

interface DashboardSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function DashboardSidebar({
  mobileOpen,
  setMobileOpen,
}: DashboardSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { handleLogout } = useAuthGuard();
  const pathname = usePathname();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    handleLogout();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-border bg-background/95 backdrop-blur">
      {/* Brand header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            BrandqoAI
          </p>
          <h1 className="text-lg font-semibold text-foreground">
            Business dashboard
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 lg:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="space-y-3 border-t border-border px-4 py-4 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative w-full justify-start gap-2"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute left-3 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          Toggle theme
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLogoutDialogOpen(true)}
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — always visible */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-shrink-0 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile — hamburger trigger + drawer */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-4 z-40"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="h-full w-80 max-w-[85vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </div>
          </div>
        )}
      </div>

      {/* Logout confirmation — rendered outside sidebar DOM so it overlays
          correctly on both mobile and desktop without z-index conflicts */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        title="Log out of BrandqoAI?"
        description="You will be redirected to the login page. Any unsaved changes will be lost."
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Stay
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={confirmLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Yes, log out
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          You are currently signed in to your BrandqoAI workspace. Logging out
          will end your session across all active tabs.
        </p>
      </Dialog>
    </>
  );
}
