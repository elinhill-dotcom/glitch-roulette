"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-[color-mix(in_oklab,var(--card2),white_2%)] shadow-2xl",
          "transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-sm font-semibold tracking-widest text-[color-mix(in_oklab,var(--foreground),white_10%)]">
              {title}
            </div>
            <button
              type="button"
              className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-black hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-5 pb-24">{children}</div>
          {footer ? (
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[color-mix(in_oklab,var(--card2),black_12%)]/90 px-5 py-4 backdrop-blur">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

