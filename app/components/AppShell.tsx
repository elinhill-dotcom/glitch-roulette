"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { cn } from "../lib/utils";
import { useAdmin } from "../state/admin";

export function AppShell({ children }: { children: React.ReactNode }) {
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
                sizes="128px"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="text-sm font-black tracking-wide sm:text-base">Not a Flinch</div>
              <div className="text-[11px] font-semibold text-white/70">
                Spicy multiplayer challenge
              </div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={admin.toggle}
              className={cn(
                "rounded-full border px-3 py-2 text-[11px] font-bold tracking-widest",
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
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 text-xs text-[var(--muted)]">
        Powered by a tiny bit of roulette.
      </footer>
    </div>
  );
}
