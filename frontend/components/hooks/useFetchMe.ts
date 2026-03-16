"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // React 19 / Next 15+ standard

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface User {
  id: string;
  name: string | null;
  email: string;
}

export const useFetchMe = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          // The browser automatically sends the secure cookie with this flag
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Unauthenticated");
        }

        const data = await response.json();
        setUser(data.user);
        // void router.replace("/dashboard");
      } catch (error) {
        // If cookie is missing or invalid, redirect to login
        // void router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      void router.replace("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return { user, loading, handleLogout };
};
