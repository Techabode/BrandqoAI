"use client";

import { usePathname } from "next/navigation";
import { LandingNav } from "./_components/LandingNav";
import { Footer } from "./_components/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Define routes where you want to HIDE the Nav and Footer
//   const hideLayout =
        // pathname.startsWith("/login") || pathname.startsWith("/dashboard");
    const hideLayout = ["/login", "/dashboard"].includes(pathname)

  return (
    <>
      {!hideLayout && <LandingNav />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
