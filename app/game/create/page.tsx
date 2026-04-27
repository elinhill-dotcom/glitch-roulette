"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { NeonCard } from "../../components/ui/NeonCard";
import { randomRoomCode } from "../../lib/game";

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = React.useState("Host");
  const [online, setOnline] = React.useState(false);

  return (
    <div className="mx-auto w-full max-w-xl">
      <NeonCard className="relative overflow-hidden p-6 sm:p-8" glow="orange">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_320px_at_20%_0%,color-mix(in_oklab,var(--orange),transparent_88%),transparent_62%),radial-gradient(900px_320px_at_90%_0%,color-mix(in_oklab,var(--green),transparent_88%),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="orange">Create room</Badge>
            <Badge tone="neutral">Sports-bar mode</Badge>
          </div>

          <div className="text-2xl font-black tracking-tight">Start the chaos</div>
          <div className="text-sm text-[var(--muted)]">
            Pick a name, then share the room code with friends.
          </div>

          <label className="flex flex-col gap-2">
            <div className="text-xs font-bold tracking-widest text-[var(--muted)]">YOUR NAME</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neon Captain"
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold outline-none focus:border-white/18 focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-black">Online multiplayer</div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Play across devices/networks (uses Firestore).
              </div>
            </div>
            <input
              type="checkbox"
              checked={online}
              onChange={(e) => setOnline(e.target.checked)}
              className="h-5 w-5 accent-[var(--orange)]"
              aria-label="Enable online multiplayer"
            />
          </label>

          <Button
            size="lg"
            onClick={() => {
              const code = randomRoomCode();
              router.push(
                `/game/room/${code}?name=${encodeURIComponent(name)}&host=1&mode=${online ? "online" : "local"}`,
              );
            }}
          >
            Generate room code
          </Button>
        </div>
      </NeonCard>
    </div>
  );
}

