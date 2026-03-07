import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem("brandqoai_token");
    if (!token) {
      void router.replace("/login");
      return;
    }

    const fetchMe = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unauthenticated");
        }

        const data = await response.json();
        setUser(data.user);
      } catch {
        window.localStorage.removeItem("brandqoai_token");
        void router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    void fetchMe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">BrandqoAI Dashboard</h1>
          <p className="text-xs text-slate-400">High-level overview of your content studio.</p>
        </div>
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium">{user.name ?? user.email}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        )}
      </header>

      <main className="px-6 py-6 grid gap-4 md:grid-cols-3">
        <section className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold mb-2">Next scheduled posts</h2>
          <p className="text-xs text-slate-400">
            Once scheduling is wired up, you&apos;ll see a snapshot of your upcoming content here.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold mb-2">Brand profile</h2>
          <p className="text-xs text-slate-400">
            In later phases this will summarize your brand voice, pillars, and connected accounts.
          </p>
        </section>
      </main>
    </div>
  );
}

