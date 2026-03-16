"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useFetchMe } from "./useFetchMe";

export const useAuthGuard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, handleLogout } = useFetchMe();

  useEffect(() => {

    if (loading) return; // Wait for auth check

     const protectedRoutes = ['/dashboard']
      
    // LOGGED IN: Force to dashboard ONLY
    if (user && !protectedRoutes.includes(pathname)) {
      router.replace("/dashboard");
      return;
    }

    // LOGGED OUT: Block dashboard ONLY
    if (!user && protectedRoutes.includes(pathname)) {
      router.replace("/login");
      return;
    }

  }, [user, loading, pathname, router]);

  return { user, loading, handleLogout };
};
