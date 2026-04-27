import * as React from "react";
import { cn } from "../../lib/utils";

export function Badge({
  className,
  tone = "green",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "orange" | "red" | "yellow" | "neutral";
}) {
  const toneClass =
    tone === "orange"
      ? "border-[color-mix(in_oklab,var(--orange),transparent_55%)] bg-[color-mix(in_oklab,var(--orange),transparent_86%)] text-[color-mix(in_oklab,var(--orange),white_10%)]"
      : tone === "yellow"
        ? "border-[color-mix(in_oklab,var(--yellow),transparent_55%)] bg-[color-mix(in_oklab,var(--yellow),transparent_86%)] text-[color-mix(in_oklab,var(--yellow),white_10%)]"
        : tone === "red"
          ? "border-[color-mix(in_oklab,var(--red),transparent_55%)] bg-[color-mix(in_oklab,var(--red),transparent_86%)] text-[color-mix(in_oklab,var(--red),white_10%)]"
          : tone === "neutral"
            ? "border-white/12 bg-white/5 text-[var(--foreground)]"
            : "border-[color-mix(in_oklab,var(--green),transparent_55%)] bg-[color-mix(in_oklab,var(--green),transparent_86%)] text-[color-mix(in_oklab,var(--green),white_10%)]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        toneClass,
        className,
      )}
      {...props}
    />
  );
}

