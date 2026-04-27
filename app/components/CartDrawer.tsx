"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "../lib/utils";
import { useCart } from "../state/cart";
import { createOrderFromCart } from "../state/order";
import { Button } from "./ui/Button";
import { Drawer } from "./ui/Drawer";
import { NeonCard } from "./ui/NeonCard";

export function CartDrawer() {
  const cart = useCart();
  const router = useRouter();

  return (
    <Drawer
      open={cart.isOpen}
      onOpenChange={(v) => (v ? cart.open() : cart.close())}
      title="CART"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold tracking-widest text-[var(--muted)]">SUBTOTAL</div>
            <div className="text-lg font-black">{formatMoney(cart.subtotalCents)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={cart.clear} disabled={cart.itemCount === 0}>
              Clear
            </Button>
            <Button
              onClick={() => {
                const order = createOrderFromCart(cart.lines);
                cart.clear();
                cart.close();
                router.push(`/order/confirmation/${order.id}?name=Host`);
              }}
              disabled={cart.itemCount === 0}
            >
              Place order
            </Button>
          </div>
        </div>
      }
    >
      {cart.items.length === 0 ? (
        <NeonCard className="p-5" glow="none">
          <div className="text-sm font-semibold text-[var(--muted)]">Your cart is empty.</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            Add something spicy. Or something safe. We don’t judge.
          </div>
        </NeonCard>
      ) : (
        <div className="flex flex-col gap-3">
          {cart.items.map(({ product, qty }) => (
            <NeonCard key={product.id} className="p-4" glow="none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black tracking-wide">{product.name}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {formatMoney(product.priceCents)} each
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black hover:bg-white/10"
                  onClick={() => cart.remove(product.id)}
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => cart.setQty(product.id, qty - 1)}
                  >
                    -
                  </Button>
                  <div className="w-8 text-center text-sm font-black">{qty}</div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => cart.setQty(product.id, qty + 1)}
                  >
                    +
                  </Button>
                </div>
                <div className="text-sm font-black">
                  {formatMoney(product.priceCents * qty)}
                </div>
              </div>
            </NeonCard>
          ))}
        </div>
      )}
    </Drawer>
  );
}

