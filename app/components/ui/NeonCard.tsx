import * as React from "react";
import { cn } from "../../lib/utils";

export function NeonCard({
  className,
  glow = "green",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  glow?: "green" | "orange" | "none";
}) {
  const shadow = glow === "none" ? "shadow-[var(--shadow-soft)]" : "shadow-[var(--shadow-strong)]";

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card),white_3%),var(--card2))]",
        shadow,
        className,
      )}
      {...props}
    />
  );
}

