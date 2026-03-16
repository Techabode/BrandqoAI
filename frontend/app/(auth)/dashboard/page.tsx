"use client";

import { Button } from "@/components/ui/button";
import { Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuthGuard } from "@/components/hooks/useAuthGuard";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, loading, handleLogout } = useAuthGuard();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleThemeHandler = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center animate-pulse">
          <div className="h-8 bg-muted w-64 mx-auto rounded mb-4"></div>
          <div className="text-muted-foreground">Loading your dashboard...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will be redirected by hook
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold">
            BrandqoAI Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            High-level overview of your content studio.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleThemeHandler}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {user && (
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-foreground">
                {user.name ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-foreground btn-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2 card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Next scheduled posts
            </h2>
          </div>
          <div className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              Once scheduling is wired up, you&apos;ll see a snapshot of your
              upcoming content here.
            </p>
            <Button variant="outline" className="mt-4">
              Configure scheduling
            </Button>
          </div>
        </section>

        <section className="card p-8 md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-accent rounded-full" />
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Brand profile
            </h2>
          </div>
          <div className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              In later phases this will summarize your brand voice, pillars, and
              connected accounts.
            </p>
            <Button variant="outline" className="w-full mt-4">
              Setup brand profile
            </Button>
          </div>
        </section>

      </main>
    </div>
  );
}
