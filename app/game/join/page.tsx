"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { NeonCard } from "../../components/ui/NeonCard";
import { onlineMultiplayerDisabledReason } from "../../lib/multiplayerEnv";

export default function JoinRoomPage() {
  const router = useRouter();
  const search = useSearchParams();
  const initialCode = (search.get("code") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const [code, setCode] = React.useState(initialCode);
  const [name, setName] = React.useState("Player");
  const disabledReason = onlineMultiplayerDisabledReason();

  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-xl">
      <NeonCard className="relative overflow-hidden p-6 sm:p-8" glow="green">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_320px_at_20%_0%,color-mix(in_oklab,var(--green),transparent_88%),transparent_62%),radial-gradient(900px_320px_at_90%_0%,color-mix(in_oklab,var(--orange),transparent_88%),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Join room</Badge>
            <Badge tone="neutral">Bring bravery</Badge>
          </div>

          <div className="text-2xl font-black tracking-tight">Enter the arena</div>
          <div className="text-sm text-[var(--muted)]">
            Paste the room code, pick a name, and get ready to spin.
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <div className="text-xs font-bold tracking-widest text-[var(--muted)]">
                ROOM CODE
              </div>
              <input
                value={cleanCode}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ABC123"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black tracking-[0.35em] outline-none focus:border-white/18 focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>

            <label className="flex flex-col gap-2">
              <div className="text-xs font-bold tracking-widest text-[var(--muted)]">YOUR NAME</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Blue Thunder"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold outline-none focus:border-white/18 focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-sm font-black">Online multiplayer</div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              Always on. Join across devices/networks (Firestore).
              {disabledReason ? ` (${disabledReason})` : ""}
            </div>
          </div>

          <Button
            size="lg"
            onClick={() =>
              router.push(
                `/game/room/${cleanCode}?name=${encodeURIComponent(name)}&mode=online`,
              )
            }
            disabled={cleanCode.length !== 6}
          >
            Join
          </Button>
        </div>
      </NeonCard>
    </div>
  );
}

