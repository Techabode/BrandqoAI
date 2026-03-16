import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrandqoAI - Login",
  description: "AI-powered brand intelligence platform Login page",
};

export default function NoAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
      <>
        <div className="mt-5 ml-5 ">
          <Link href="/" className="flex justify-start items-center">
            <ArrowLeft className="mr-2" /> Back
          </Link>
        </div>
        {children} 
    </>
    );
}

