"use client";

import { UserPlus, MessageSquare, Rocket } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Register & Connect",
    description:
      "Sign up, add your brand details, and connect your Instagram, Facebook, and X/Twitter accounts.",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Chat with Your AI",
    description:
      "Tell BrandqoAI about your goals via WhatsApp or the dashboard. It learns your voice and generates a content calendar.",
  },
  {
    step: "03",
    icon: Rocket,
    title: "Publish on Autopilot",
    description:
      "Review, edit if needed, and let the AI automatically publish your posts on schedule across all platforms.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-secondary/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-foreground">
            Three steps to social media freedom
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.step} className="relative text-center">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[66%] w-[80%] h-px border-t-2 border-dashed border-primary/20" />
              )}
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-5 mx-auto">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Step {step.step}
              </span>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
