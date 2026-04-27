"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, MenuProduct } from "../lib/types";
import { getProductById } from "../lib/menu";

type CartState = {
  isOpen: boolean;
  lines: CartLine[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  items: Array<{ product: MenuProduct; qty: number }>;
  subtotalCents: number;
  itemCount: number;
};

const CartContext = createContext<CartState | null>(null);

const STORAGE_KEY = "glitchRoulette.cart.v1";

function clampQty(qty: number) {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(0, Math.min(99, Math.round(qty)));
}

function loadCartLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const next: CartLine[] = [];
    for (const x of parsed) {
      if (!x || typeof x !== "object") continue;
      const obj = x as { productId?: unknown; qty?: unknown };
      const productId = typeof obj.productId === "string" ? obj.productId : String(obj.productId ?? "");
      const qty = clampQty(Number(obj.qty));
      if (productId && qty > 0) next.push({ productId, qty });
    }
    return next;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState<CartLine[]>(() => loadCartLines());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines]);

  const items = useMemo(() => {
    return lines
      .map((l) => ({ product: getProductById(l.productId), qty: l.qty }))
      .filter((x): x is { product: MenuProduct; qty: number } => !!x.product);
  }, [lines]);

  const subtotalCents = useMemo(
    () => items.reduce((sum, x) => sum + x.product.priceCents * x.qty, 0),
    [items],
  );
  const itemCount = useMemo(() => items.reduce((sum, x) => sum + x.qty, 0), [items]);

  const value: CartState = useMemo(
    () => ({
      isOpen,
      lines,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
      add: (productId: string, qty = 1) => {
        const addQty = clampQty(qty);
        if (addQty <= 0) return;
        setLines((prev) => {
          const idx = prev.findIndex((l) => l.productId === productId);
          if (idx === -1) return [...prev, { productId, qty: addQty }];
          const next = [...prev];
          next[idx] = { ...next[idx], qty: clampQty(next[idx].qty + addQty) };
          return next.filter((l) => l.qty > 0);
        });
        setIsOpen(true);
      },
      remove: (productId: string) =>
        setLines((prev) => prev.filter((l) => l.productId !== productId)),
      setQty: (productId: string, qty: number) => {
        const nextQty = clampQty(qty);
        setLines((prev) => {
          const next = prev.map((l) => (l.productId === productId ? { ...l, qty: nextQty } : l));
          return next.filter((l) => l.qty > 0);
        });
      },
      clear: () => setLines([]),
      items,
      subtotalCents,
      itemCount,
    }),
    [isOpen, lines, items, subtotalCents, itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

