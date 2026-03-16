"use client";

import { Instagram, Facebook, Twitter, MessageCircle } from "lucide-react";

const platforms = [
  { icon: MessageCircle, label: "WhatsApp", colorClass: "platform-whatsapp" },
  { icon: Instagram, label: "Instagram", colorClass: "platform-instagram" },
  { icon: Facebook, label: "Facebook", colorClass: "platform-facebook" },
  { icon: Twitter, label: "X / Twitter", colorClass: "platform-twitter" },
] as const;

export function PlatformBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {platforms.map((platform) => {
        const Icon = platform.icon;

        return (
          <span
            key={platform.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${platform.colorClass}`}
          >
            <Icon className="h-4 w-4" />
            {platform.label}
          </span>
        );
      })}
    </div>
  );
}
