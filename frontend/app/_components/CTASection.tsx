"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { PlatformBadges } from "./PlatformBadges";

export function CTASection() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="rounded-2xl bg-brand-navy p-10 sm:p-14 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative z-10">
            <Zap className="h-8 w-8 text-primary mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-primary-foreground mb-4">
              Ready to automate your social media?
            </h2>
            <p className="text-base text-primary-foreground/70 mb-8 max-w-lg mx-auto leading-relaxed">
              Join thousands of creators who save 10+ hours per week with
              BrandqoAI. Start free, upgrade when you&apos;re ready.
            </p>

            <Button variant="hero" size="lg" className="gap-2 text-base px-10 mb-6" >
              <Link href="/login" className="flex flex-row justify-center items-center">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>

            <div className="mt-6">
              <PlatformBadges />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}