"use client";

import {
  MessageCircle,
  Palette,
  ImagePlus,
  CalendarClock,
  LayoutDashboard,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "WhatsApp Creator Bot",
    description:
      "Chat-first onboarding and content generation. Just message your AI assistant to create posts, captions, and ideas.",
    colorClass: "stat-card-green",
    iconColor: "text-primary",
  },
  {
    icon: Palette,
    title: "Brand-Aware AI",
    description:
      "Captures your brand voice, target audience, and content pillars to ensure every post is perfectly on-brand.",
    colorClass: "stat-card-orange",
    iconColor: "text-accent",
  },
  {
    icon: ImagePlus,
    title: "Content & Poster Generation",
    description:
      "AI-generated post ideas, captions, and stunning poster designs — ready to publish or edit to your liking.",
    colorClass: "stat-card-blue",
    iconColor: "text-brand-blue",
  },
  {
    icon: CalendarClock,
    title: "Multi-Platform Scheduling",
    description:
      "Schedule posts to Instagram, Facebook, and X/Twitter from one place. Set it and forget it.",
    colorClass: "stat-card-purple",
    iconColor: "text-brand-purple",
  },
  {
    icon: LayoutDashboard,
    title: "Web Dashboard",
    description:
      "Calendar view, brand preferences, analytics, and social account management — all in one beautiful interface.",
    colorClass: "bg-secondary",
    iconColor: "text-foreground",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Features
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-foreground">
            Everything you need to dominate social
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            From idea to published post, BrandqoAI handles the heavy lifting so
            you can focus on growing your business.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className={`rounded-xl p-6 ${feature.colorClass} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/5 ${
                  i === features.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="inline-flex rounded-lg p-3 bg-card shadow-sm mb-5">
                  <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
