"use client";

import { Zap } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-background/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 gap-4 flex flex-col ">
        <div className=" flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 mb-5">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-base font-bold text-foreground tracking-tight">
              <Link href="/">BrandqoAI</Link>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/privacy"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-xs sm:text-sm text-muted-foreground text-center ">
          © {new Date().getFullYear()} BrandqoAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
