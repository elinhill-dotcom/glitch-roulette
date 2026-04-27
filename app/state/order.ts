"use client";

import type { CartLine } from "../lib/types";
import { getProductById } from "../lib/menu";
import { randomRoomCode } from "../lib/game";
import { safeId } from "../lib/utils";

export type OrderLine = {
  productId: string;
  name: string;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type Order = {
  id: string;
  createdAt: number;
  lines: OrderLine[];
  subtotalCents: number;
  hasGame: boolean;
  roomCode?: string;
};

const STORAGE_KEY = "glitchRoulette.orders.v1";

function loadAll(): Record<string, Order> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, Order>;
  } catch {
    return {};
  }
}

function saveAll(next: Record<string, Order>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function createOrderFromCart(lines: CartLine[]) {
  const resolved: OrderLine[] = [];
  for (const l of lines) {
    const p = getProductById(l.productId);
    if (!p) continue;
    const qty = Math.max(1, Math.min(99, Math.round(l.qty)));
    const unit = p.priceCents;
    resolved.push({
      productId: p.id,
      name: p.name,
      qty,
      unitPriceCents: unit,
      lineTotalCents: unit * qty,
    });
  }
  const subtotalCents = resolved.reduce((s, x) => s + x.lineTotalCents, 0);
  const hasGame = resolved.some((x) => x.productId === "game_not_a_glitch");

  const id = safeId("order");
  const order: Order = {
    id,
    createdAt: Date.now(),
    lines: resolved,
    subtotalCents,
    hasGame,
    roomCode: hasGame ? randomRoomCode() : undefined,
  };

  const all = loadAll();
  all[id] = order;
  saveAll(all);
  return order;
}

export function getOrder(orderId: string) {
  const all = loadAll();
  return all[orderId] ?? null;
}

