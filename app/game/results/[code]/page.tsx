"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { NeonCard } from "../../../components/ui/NeonCard";
import { useRoom } from "../../../state/room";

export default function ResultsPage() {
  // useSearchParams must run inside a Suspense boundary so Next.js can statically
  // analyse the page during the production build.
  return (
    <React.Suspense fallback={null}>
      <ResultsPageInner />
    </React.Suspense>
  );
}

function ResultsPageInner() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = String(params.code ?? "").toUpperCase();
  const name = search.get("name") ?? "Player";

  const room = useRoom(code, name);
  const game = room.game;
  const players = room.players;

  const rows = React.useMemo(() => {
    const order = game?.playerOrder ?? players.map((p) => p.id);
    const byId = new Map(players.map((p) => [p.id, p] as const));
    return order
      .map((id) => {
        const p = byId.get(id);
        const s = game?.scores[id];
        return p && s ? { p, s } : null;
      })
      .filter((x): x is { p: typeof players[number]; s: { safe: number; glitched: number; betPoints: number } } => x !== null);
  }, [game, players]);

  const anyGlitched = React.useMemo(() => {
    if (!game) return false;
    return Object.values(game.scores).some((s) => s.glitched > 0);
  }, [game]);

  const burnedByPlayerId = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!game) return map;
    for (const e of game.protocol ?? []) {
      if (!e.playerId) continue;
      const burned = (e.status === "panic" || e.status === "glitch") && e.heat === "hot";
      if (!burned) continue;
      map.set(e.playerId, (map.get(e.playerId) ?? 0) + 1);
    }
    return map;
  }, [game]);

  const anyBurned = React.useMemo(() => {
    if (!game) return false;
    return Array.from(burnedByPlayerId.values()).some((n) => n > 0);
  }, [burnedByPlayerId, game]);

  const winner = React.useMemo(() => {
    if (!game) return null;
    const order = game.playerOrder;
    if (order.length === 0) return null;
    // If anyone got burned (flinch + hot), they are out of contention for winning.
    const candidates = order.filter((id) => (burnedByPlayerId.get(id) ?? 0) === 0);
    const pool = candidates.length ? candidates : order;
    let bestId = pool[0]!;
    for (const id of pool.slice(1)) {
      const a = game.scores[bestId] ?? { safe: 0, glitched: 0, betPoints: 0 };
      const b = game.scores[id] ?? { safe: 0, glitched: 0, betPoints: 0 };
      if (anyBurned) {
        // Winner among non-burned: betting points decide (tie-break by fewer flinches).
        if (b.betPoints > a.betPoints) bestId = id;
        else if (b.betPoints === a.betPoints && b.glitched < a.glitched) bestId = id;
      } else if (anyGlitched) {
        // fewer glitches wins, tie-break by betting points
        if (b.glitched < a.glitched) bestId = id;
        else if (b.glitched === a.glitched && b.betPoints > a.betPoints) bestId = id;
      } else {
        // betting wins if no glitches
        if (b.betPoints > a.betPoints) bestId = id;
      }
    }
    return players.find((p) => p.id === bestId) ?? null;
  }, [anyBurned, anyGlitched, burnedByPlayerId, game, players]);

  const loser = React.useMemo(() => {
    if (!game) return null;
    const order = game.playerOrder;
    if (order.length === 0) return null;
    if (anyBurned) {
      // "If you flinch you lose" becomes decisive when it's a HOT bite: burned players lose.
      // If multiple are burned, betting decides who loses (lowest betPoints loses).
      const burned = order.filter((id) => (burnedByPlayerId.get(id) ?? 0) > 0);
      if (burned.length === 0) return null;
      let worstId = burned[0]!;
      for (const id of burned.slice(1)) {
        const aBurn = burnedByPlayerId.get(worstId) ?? 0;
        const bBurn = burnedByPlayerId.get(id) ?? 0;
        const a = game.scores[worstId] ?? { safe: 0, glitched: 0, betPoints: 0 };
        const b = game.scores[id] ?? { safe: 0, glitched: 0, betPoints: 0 };
        if (bBurn > aBurn) worstId = id;
        else if (bBurn === aBurn && b.betPoints < a.betPoints) worstId = id;
      }
      return players.find((p) => p.id === worstId) ?? null;
    }

    let worstId = order[0]!;
    for (const id of order.slice(1)) {
      const a = game.scores[worstId] ?? { safe: 0, glitched: 0, betPoints: 0 };
      const b = game.scores[id] ?? { safe: 0, glitched: 0, betPoints: 0 };
      if (anyGlitched) {
        // more glitches loses, tie-break by fewer betting points
        if (b.glitched > a.glitched) worstId = id;
        else if (b.glitched === a.glitched && b.betPoints < a.betPoints) worstId = id;
      } else {
        // betting loses if no glitches
        if (b.betPoints < a.betPoints) worstId = id;
      }
    }
    return players.find((p) => p.id === worstId) ?? null;
  }, [anyBurned, anyGlitched, burnedByPlayerId, game, players]);

  const done = game?.phase === "finished";

  return (
    <div className="flex flex-col gap-5">
      <NeonCard className="relative overflow-hidden p-6 sm:p-8" glow="orange">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_320px_at_20%_0%,color-mix(in_oklab,var(--orange),transparent_88%),transparent_62%),radial-gradient(900px_320px_at_90%_0%,color-mix(in_oklab,var(--green),transparent_88%),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="orange">Results</Badge>
            <Badge tone="green">{code}</Badge>
          </div>
          <div className="text-2xl font-black tracking-tight sm:text-3xl">Scoreboard</div>
          <div className="text-sm text-[var(--muted)]">
            If someone gets burned (flinch + Bombay Burner): they lose. If multiple burn: betting decides.
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{room.players.length} players</Badge>
              {!done ? <Badge tone="neutral">In progress</Badge> : <Badge tone="green">Complete</Badge>}
              {anyBurned ? <Badge tone="red">Burned rule</Badge> : anyGlitched ? <Badge tone="red">Flinch scoring</Badge> : <Badge tone="green">Betting scoring</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/game/room/${code}?name=${encodeURIComponent(room.self.name)}`}>
                <Button variant="secondary">Back to room</Button>
              </Link>
              <Button onClick={() => room.dispatch({ a: "reset" })} disabled={!game}>
                Play again
              </Button>
            </div>
          </div>
        </div>
      </NeonCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {!game ? (
          <NeonCard className="p-6" glow="green">
            <div className="text-sm font-black tracking-wide">No game found</div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              Head back to the room and create a match.
            </div>
          </NeonCard>
        ) : (
          rows
            .slice()
            .sort((a, b) => {
              const aBurn = burnedByPlayerId.get(a.p.id) ?? 0;
              const bBurn = burnedByPlayerId.get(b.p.id) ?? 0;
              if (aBurn !== bBurn) return aBurn - bBurn; // non-burned first
              if (anyGlitched) return a.s.glitched - b.s.glitched;
              return b.s.betPoints - a.s.betPoints;
            })
            .map((x, idx) => (
            <NeonCard key={x.p.id} className="p-6" glow={idx === 0 ? "orange" : "none"}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black tracking-wide">
                    #{idx + 1} {x.p.name}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    ✓ {x.s.safe} safe • ✕ {x.s.glitched} flinched • ☠ {burnedByPlayerId.get(x.p.id) ?? 0} burned • 🎯 {x.s.betPoints} betting
                  </div>
                </div>
                <Badge tone={(burnedByPlayerId.get(x.p.id) ?? 0) > 0 ? "red" : "neutral"}>
                  {(burnedByPlayerId.get(x.p.id) ?? 0) > 0 ? "BURNED" : "OK"}
                </Badge>
              </div>
              {winner?.id === x.p.id ? (
                <div className="mt-3 rounded-2xl border border-[color-mix(in_oklab,var(--yellow),transparent_35%)] bg-[color-mix(in_oklab,var(--yellow),transparent_86%)] p-4 text-sm font-black text-[color-mix(in_oklab,var(--yellow),black_20%)]">
                  🏆 Winner
                </div>
              ) : null}
              {loser?.id === x.p.id ? (
                <div className="mt-3 rounded-2xl border border-[color-mix(in_oklab,var(--red),transparent_25%)] bg-[color-mix(in_oklab,var(--red),transparent_88%)] p-4 text-sm font-black text-[color-mix(in_oklab,var(--red),white_10%)]">
                  ☠ Lost
                </div>
              ) : null}
            </NeonCard>
          ))
        )}
      </div>

      {game && winner ? (
        <NeonCard className="p-6" glow="none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black tracking-wide">Share</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                Copy a brag message for Instagram/TikTok.
              </div>
            </div>
            <Button
              onClick={() => {
                const winnerName = winner?.name ?? "Someone";
                const loserName = loser?.name;
                const msg = `🌶️ I played "Not a Flinch" on Flinch Roulette! ${winnerName} won 🏆${loserName ? ` — ${loserName} lost 😭` : ""} #NotAFlinch #SpiceChallenge #FlinchRoulette`;
                navigator.clipboard.writeText(msg);
              }}
            >
              Copy text
            </Button>
          </div>
        </NeonCard>
      ) : null}
    </div>
  );
}

