"use client";
// components/ui/dialog.tsx
import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Max width class, defaults to "max-w-4xl" */
  maxWidth?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-4xl",
}: DialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 px-7 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl border border-border bg-background p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="dialog-title" className="text-xl font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="mt-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
