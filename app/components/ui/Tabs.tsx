"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export function Tabs<T extends string>({
  value,
  onValueChange,
  items,
  className,
}: {
  value: T;
  onValueChange: (v: T) => void;
  items: Array<{
    id: T;
    label: string;
    tone?: "green" | "orange";
  }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="tablist"
      aria-label="Categories"
    >
      {items.map((it) => {
        const active = it.id === value;
        const accent = it.tone === "orange" ? "var(--orange)" : "var(--green)";
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active}
            onClick={() => onValueChange(it.id)}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-2 text-sm font-black tracking-wide transition",
              "border-white/12 bg-[color-mix(in_oklab,var(--card2),white_2%)] hover:bg-[color-mix(in_oklab,var(--card2),white_6%)]",
              "data-[active=true]:border-white/18",
            )}
            style={
              active
                ? ({
                    boxShadow: "var(--shadow-soft)",
                    borderColor: `color-mix(in oklab, ${accent}, transparent 55%)`,
                    background: "color-mix(in oklab, var(--card2), white 5%)",
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span className="relative">
              {it.label}
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute -bottom-2 left-0 right-0 mx-auto h-0.5 w-8 rounded-full opacity-0 transition",
                  active && "opacity-100",
                )}
                style={{ background: `color-mix(in oklab, ${accent}, white 10%)` }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

