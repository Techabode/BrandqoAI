"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL = "/api";
type Status = "loading" | "error";

function WhatsAppLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Signing you in from your WhatsApp link...");

  useEffect(() => {
    const consumeLink = async () => {
      if (!token) {
        setStatus("error");
        setMessage("This sign-in link is missing a token. Please request a new link from WhatsApp.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/whatsapp-link-login`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? "This sign-in link is invalid or expired.");
        }

        void router.replace("/dashboard");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "This sign-in link is invalid or expired.");
      }
    };

    void consumeLink();
  }, [router, token]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="card max-w-xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          {status === "loading" ? "Signing you in" : "Sign-in link issue"}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}

export default function WhatsAppLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="card max-w-xl p-8 text-center space-y-4">
            <h1 className="text-2xl font-heading font-semibold text-foreground">Signing you in</h1>
            <p className="text-sm text-muted-foreground">Preparing your secure WhatsApp handoff...</p>
          </div>
        </main>
      }
    >
      <WhatsAppLoginContent />
    </Suspense>
  );
}
