"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuthForm } from "@/components/hooks/useAuthForms";
import { Button } from "@/components/ui/button";
import { useAuthGuard } from "@/components/hooks/useAuthGuard";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const { user, loading } = useAuthGuard();

  const {
    mode,
    toggleMode,
    formData,
    handleChange,
    handleSubmit,
    loading: processing,
    errors,
    serverError,
    togglePassword,
  } = useAuthForm();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleThemeHandler = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) return null;

  // If already logged in, redirect handled by useAuthGuard
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

  if (user) {
    return null; // Will be redirected by hook
  }
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-heading font-semibold text-foreground text-center flex-1">
            BrandqoAI
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleThemeHandler}
            className="h-9 w-9 shrink-0"
          >
            <Sun className="h-4 w-4 size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        {/* Tab Toggle - Managed by the hook */}
        <div className="flex mb-6 rounded-full bg-muted p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMode(m)}
              className={`flex-1 py-3 px-4 text-sm rounded-full font-medium transition-all cursor-pointer duration-200 btn-secondary ${
                mode === m ? "bg-background shadow-sm" : ""
              }`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="form-field">
              <label className="sr-only">Name</label>
              <input
                name="name"
                type="text"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                disabled={processing}
                className="input"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1.5 leading-tight">
                  {errors.name}
                </p>
              )}
            </div>
          )}

          <div className="form-field">
            <label className="sr-only">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              disabled={processing}
              className="input"
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1.5 leading-tight">
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-field relative">
            <label className="sr-only">Password</label>
            <input
              name="password"
              type={formData.showPassword ? "text" : "password"}
              placeholder="Password (8+ characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={processing}
              className="input pr-10"
            />
            <button
              type="button"
              onClick={togglePassword}
              disabled={processing}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
              aria-label={
                formData.showPassword ? "Hide password" : "Show password"
              }
            >
              {formData.showPassword ? "Hide" : "Show"}
            </button>
            {errors.password && (
              <p className="text-xs text-destructive mt-1.5 leading-tight">
                {errors.password}
              </p>
            )}
          </div>

          {serverError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-[var(--radius-lg)]">
              <p className="text-sm text-destructive-foreground text-center">
                {serverError}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 btn-primary shadow-lg hover:shadow-primary/25"
            disabled={processing}
          >
            {processing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : mode === "login" ? (
              "Sign in to your account"
            ) : (
              "Create your account"
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to our{" "}
            <a href="#" className="text-primary hover:underline font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline font-medium">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
