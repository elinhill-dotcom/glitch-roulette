"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "../lib/utils";
import { useAdmin } from "../state/admin";
import { useCart } from "../state/cart";
import { CartDrawer } from "./CartDrawer";
import { Badge } from "./ui/Badge";

function HeaderChip({
  active,
  children,
  onClick,
  ariaLabel,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black tracking-wide transition",
        active
          ? "border-white/18 bg-white/12 shadow-[var(--shadow-soft)]"
          : "border-white/12 bg-white/6 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-black tracking-wide transition",
        active
          ? "border-white/18 bg-white/12 shadow-[var(--shadow-soft)]"
          : "border-white/12 bg-white/6 hover:bg-white/10",
      )}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const admin = useAdmin();

  return (
    <div className="min-h-screen">
      <div
        className="pointer-events-none fixed inset-y-0 left-0 w-[10px] opacity-90"
        style={{
          background: "color-mix(in oklab, var(--background), black 18%)",
          boxShadow: "inset -1px 0 0 rgba(255,255,255,0.08)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-y-0 right-0 w-[10px] opacity-90"
        style={{
          background: "color-mix(in oklab, var(--background), black 18%)",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.08)",
        }}
        aria-hidden="true"
      />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[color-mix(in_oklab,var(--background),black_18%)]">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-32 overflow-hidden rounded-xl border border-white/12 bg-white/10 shadow-[var(--shadow-soft)]">
              <Image
                src="/logo.png"
                alt="Flinch Roulette logo"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="text-sm font-black tracking-wide sm:text-base">Absalud the best!</div>
              <div className="text-[11px] font-semibold text-white/70">premium sports bar ordering</div>
            </div>
          </Link>

          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <NavItem href="/menu" label="Menu" />
            <NavItem href="/game" label="Spicy Challenge" />
            <NavItem href="/admin" label="Admin" />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:ml-3">
            <HeaderChip onClick={cart.toggle} ariaLabel="Open cart">
              Cart
              {cart.itemCount > 0 ? <Badge tone="orange">{cart.itemCount}</Badge> : null}
            </HeaderChip>
            <button
              type="button"
              onClick={admin.toggle}
              className={cn(
                "hidden rounded-full border px-3 py-2 text-xs font-bold tracking-widest sm:inline-flex",
                admin.enabled
                  ? "border-[color-mix(in_oklab,var(--orange),transparent_50%)] bg-[color-mix(in_oklab,var(--orange),transparent_86%)] text-[color-mix(in_oklab,var(--orange),white_10%)]"
                  : "border-white/10 bg-white/5 text-[var(--muted)] hover:bg-white/8",
              )}
              aria-label="Toggle admin mode"
              title="Toggle admin mode"
            >
              ADMIN {admin.enabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg,var(--green),var(--orange),var(--red),var(--yellow))",
          }}
          aria-hidden="true"
        />

        <div className="border-b border-white/10 bg-black/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-2">
            <Link
              href="/game"
              className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-label="Open Spicy Challenge"
            >
              <div className="marquee cursor-pointer select-none">
                <div className="marquee__inner">
                  <span className="marquee__item">
                    Try our new table game, if you dare! Spicy challange.
                  </span>
                  <span className="marquee__sep" aria-hidden="true">
                    •
                  </span>
                  <span className="marquee__item">
                    Try our new table game, if you dare! Spicy challange.
                  </span>
                  <span className="marquee__sep" aria-hidden="true">
                    •
                  </span>
                  <span className="marquee__item">
                    Try our new table game, if you dare! Spicy challange.
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:hidden">
          <div className="flex gap-2">
            <NavItem href="/menu" label="Menu" />
            <NavItem href="/game" label="Game" />
            <NavItem href="/admin" label="Admin" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <CartDrawer />

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 text-xs text-[var(--muted)]">
        Powered by the matchday rush — and a tiny bit of roulette.
      </footer>
    </div>
  );
}

