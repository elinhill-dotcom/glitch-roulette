import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-black tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50 disabled:pointer-events-none";
  const sizes =
    size === "sm"
      ? "h-9 px-3 text-sm"
      : size === "lg"
        ? "h-12 px-5 text-base"
        : "h-10 px-4 text-sm";
  const variants: Record<Variant, string> = {
    primary:
      "bg-[color-mix(in_oklab,var(--yellow),white_10%)] text-[color-mix(in_oklab,var(--background),black_10%)] shadow-[var(--shadow-strong)] hover:brightness-105 active:brightness-95",
    secondary:
      "bg-[color-mix(in_oklab,var(--card),white_2%)] text-[var(--foreground)] border border-white/14 hover:border-white/22 hover:bg-[color-mix(in_oklab,var(--card),white_6%)] shadow-[var(--shadow-soft)]",
    ghost:
      "bg-transparent text-[var(--foreground)] hover:bg-white/6 border border-white/0 hover:border-white/14",
    danger:
      "bg-[linear-gradient(135deg,color-mix(in_oklab,var(--red),white_6%),color-mix(in_oklab,var(--yellow),white_6%))] text-black hover:brightness-110 active:brightness-95",
  };
  return (
    <button className={cn(base, sizes, variants[variant], className)} {...props} />
  );
}

