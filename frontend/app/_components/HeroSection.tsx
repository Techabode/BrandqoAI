"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dashboardPreview from "@/assets/dashboard-preview.png";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-brand-green-light via-background to-brand-blue-light opacity-60" />
      <div className="absolute top-20 right-0 w-125 h-125 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-100 h-100 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Social Media Manager
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-[1.1] max-w-3xl mx-auto animate-fade-in">
          Your brand&apos;s social media,{" "}
          <span className="text-primary">on autopilot</span>
        </h1>

        <p className="mt-5 text-center text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in leading-relaxed">
          Plan, generate and schedule on-brand content to Instagram, Facebook
          and X/Twitter — all from WhatsApp or your dashboard.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
          <Button variant="hero" size="lg" className="gap-2 text-base px-8">
            <Link
              href="/login"
              className="flex flex-row justify-center items-center"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button variant="hero-outline" size="lg" className="text-base px-8">
            <Link href="/#">See How It Works</Link>
          </Button>
        </div>

        {/* Social proof */}
        <p className="mt-6 text-center text-sm text-muted-foreground animate-fade-in">
          Trusted by{" "}
          <span className="font-semibold text-foreground">2,500+</span> creators
          and small businesses
        </p>

        {/* Dashboard preview */}
        <div className="mt-12 sm:mt-16 animate-fade-in">
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-4 rounded-2xl bg-linear-to-b from-primary/10 to-transparent blur-xl" />
            <Image
              src={dashboardPreview}
              alt="BrandqoAI dashboard showing content calendar with scheduled posts across Instagram, Facebook and Twitter"
              className="relative rounded-xl border border-border shadow-2xl shadow-primary/10 w-full"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
              quality={85}
            />
          </div>
        </div>
      </div>
    </section>
  );
}