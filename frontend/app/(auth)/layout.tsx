// app/(auth)/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "../_components/Footer";
import { AuthLayoutClient } from "../_components/AuthLayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrandqoAI - Dashboard",
  description: "AI-powered brand intelligence platform",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <AuthLayoutClient>{children}</AuthLayoutClient>
      <Footer />
    </div>
  );
}
