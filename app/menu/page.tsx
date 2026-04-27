"use client";

import Image from "next/image";
import * as React from "react";
import { CategoryTabs } from "../components/CategoryTabs";
import { ProductCard } from "../components/ProductCard";
import { NeonCard } from "../components/ui/NeonCard";
import { CATEGORIES, PRODUCTS } from "../lib/menu";
import type { MenuCategoryId } from "../lib/types";
import { useAdmin } from "../state/admin";
import { Badge } from "../components/ui/Badge";

export default function MenuPage() {
  const admin = useAdmin();
  const [cat, setCat] = React.useState<MenuCategoryId>(CATEGORIES[0]?.id ?? "wings");

  const category = CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0];
  const visible = PRODUCTS.filter((p) => p.categoryId === cat);

  return (
    <div className="flex flex-col gap-5">
      <NeonCard className="relative overflow-hidden p-0" glow="none">
        <div className="relative h-40 w-full sm:h-48">
          <Image
            src="/hero/menu-hero.png"
            alt="Menu hero"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 900px"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10),rgba(0,0,0,0.72))]" />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-1"
            style={{
              background:
                "linear-gradient(90deg,var(--green),var(--orange),var(--red),var(--yellow))",
            }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
            <div className="text-2xl font-black tracking-tight sm:text-4xl">Menu</div>
            <div className="mt-2 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
              Pick a category, add items, checkout when ready.
            </div>
            {admin.enabled ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="orange">Admin mode</Badge>
              </div>
            ) : null}
          </div>
        </div>
      </NeonCard>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-base font-black tracking-wide sm:text-lg">{category?.label}</div>
            <div className="text-sm text-[var(--muted)]">{category?.tagline}</div>
          </div>
        </div>
        <CategoryTabs
          value={cat}
          onValueChange={setCat}
          items={CATEGORIES.map((c) => ({ id: c.id, label: c.label, accent: c.accent }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

