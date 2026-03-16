import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Footer } from "../_components/Footer";

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
  description: "AI-powered brand intelligence platform Landing Page",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
