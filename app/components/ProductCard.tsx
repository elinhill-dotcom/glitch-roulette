"use client";

import Image from "next/image";
import * as React from "react";
import type { MenuProduct } from "../lib/types";
import { cn, formatMoney } from "../lib/utils";
import { useAdmin } from "../state/admin";
import { useCart } from "../state/cart";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { NeonCard } from "./ui/NeonCard";

function HeatPips({ heat }: { heat: MenuProduct["heat"] }) {
  if (heat === 0) return <Badge tone="neutral">No heat</Badge>;
  const label = ["", "Mild", "Warm", "Hot", "Wild", "Inferno"][heat] ?? "Heat";
  /* Menu should stay sports-bar palette (no warning red/yellow) */
  const tone = heat >= 4 ? "orange" : heat >= 2 ? "green" : "neutral";
  return <Badge tone={tone}>{label}</Badge>;
}

export function ProductCard({ product }: { product: MenuProduct }) {
  const cart = useCart();
  const admin = useAdmin();

  const override = admin.overrides[product.id];
  const priceCents = override?.priceCents ?? product.priceCents;
  const isAvailable = override?.isAvailable ?? product.isAvailable;
  const dollarsDefault = String(Math.round(priceCents / 100));

  return (
    <NeonCard className="flex h-full flex-col overflow-hidden" glow="none">
      <div className="relative h-40 w-full">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={cn("object-cover", !isAvailable && "opacity-40 grayscale")}
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-white/5" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.45))]" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-black tracking-tight">{product.name}</div>
            <div className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
              {product.description}
            </div>
          </div>
          <div className="shrink-0 text-sm font-black">{formatMoney(priceCents)}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HeatPips heat={product.heat} />
          {!isAvailable ? <Badge tone="neutral">Sold out</Badge> : null}
        </div>

        <Button
          onClick={() => cart.add(product.id, 1)}
          disabled={!isAvailable}
          className="mt-auto w-full"
          size="lg"
        >
          Add to cart
        </Button>

        {admin.enabled ? (
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black">
              <span className="text-[var(--muted)]">$</span>
              <input
                key={`${product.id}:${priceCents}`}
                defaultValue={dollarsDefault}
                onChange={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^\d]/g, "");
                }}
                onBlur={(e) => {
                  const dollars = Number(e.currentTarget.value.replace(/[^\d]/g, "") || "0");
                  admin.setOverride(product.id, {
                    priceCents: Math.max(0, Math.round(dollars)) * 100,
                  });
                }}
                inputMode="numeric"
                className="w-12 bg-transparent text-right outline-none"
              />
            </label>

            <button
              type="button"
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-black tracking-widest transition",
                isAvailable
                  ? "border-[color-mix(in_oklab,var(--green),transparent_55%)] bg-[color-mix(in_oklab,var(--green),transparent_88%)] text-[color-mix(in_oklab,var(--green),white_10%)]"
                  : "border-white/10 bg-white/5 text-[var(--muted)] hover:bg-white/8",
              )}
              onClick={() => admin.setOverride(product.id, { isAvailable: !isAvailable })}
            >
              {isAvailable ? "LIVE" : "PAUSE"}
            </button>
          </div>
        ) : null}
      </div>
    </NeonCard>
  );
}

