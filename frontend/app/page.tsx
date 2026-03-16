"use client";

import FeatureCard from "@/components/ui/FeatureCard";
import Step from "@/components/ui/Steps";
import {  MessageCircle,  Sparkles,  Calendar,  LayoutDashboard,} from "lucide-react";
import { LandingNav } from "./_components/LandingNav";
import { HeroSection } from "./_components/HeroSection";
import { FeaturesSection } from "./_components/Features";
import { HowItWorksSection } from "./_components/HowItWorksSection";
import { CTASection } from "./_components/CTASection";
import { Footer } from "./_components/Footer";
import { useAuthGuard } from "@/components/hooks/useAuthGuard";

export default function HomePage() {
  
  const { user, loading } = useAuthGuard();

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
    return null; // Redirected to dashboard
  }
  return (
    <main className="min-h-screen bg-background">
      {/* <LandingNav /> */}
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      {/* <Footer /> */}
    </main>
  );
}
