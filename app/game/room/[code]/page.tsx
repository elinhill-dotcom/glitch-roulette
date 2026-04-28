"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { NeonCard } from "../../../components/ui/NeonCard";
import { CameraRecorder } from "../../../components/CameraRecorder";
import { cn } from "../../../lib/utils";
import { useRoom } from "../../../state/room";
import { wagerDescription, wagerLabel } from "../../../lib/game";

export default function MultiplayerRoomPage() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = String(params.code ?? "").toUpperCase();
  const name = search.get("name") ?? "Player";
  const isHostHint = search.get("host") === "1";
  const modeParam = search.get("mode");
  // Multiplayer-first: default to online unless explicitly forced to local.
  const mode = modeParam === "local" ? "local" : "online";

  const room = useRoom(code, name, { isHostHint, mode });
  const game = room.game;

  const [startPlayerId, setStartPlayerId] = React.useState<string>(room.self.id);

  const order = game?.playerOrder ?? room.players.map((p) => p.id);
  const currentPlayerId = game ? order[game.currentPlayerIndex] : null;
  const currentPlayer = room.players.find((p) => p.id === currentPlayerId) ?? null;
  const myGuess = game?.guesses[room.self.id];
  const allGuessed = game ? order.every((pid) => !!game.guesses[pid]) : false;
  const isEater = room.self.id === currentPlayerId;
  const hotRemaining = React.useMemo(() => {
    const usedHot = (game?.protocol ?? []).filter((e) => e.heat === "hot").length;
    return Math.max(0, 2 - usedHot);
  }, [game?.protocol]);
  const bitesRemaining = game ? Math.max(1, 12 - game.biteIndex) : 12;
  const hotOdds = game ? hotRemaining / bitesRemaining : null;
  const hotOddsPct = hotOdds === null ? null : Math.round(hotOdds * 100);
  const [cameraOpen, setCameraOpen] = React.useState(false);

  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!game?.eatEndsAt && !game?.countdownEndsAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [game?.eatEndsAt, game?.countdownEndsAt]);
  const secsLeft = game?.eatEndsAt ? Math.max(0, Math.ceil((game.eatEndsAt - now) / 1000)) : null;

  const protocol = game?.protocol ?? [];
  const protocolTone = (status: string) => {
    if (status === "safe")
      return "border-[color-mix(in_oklab,var(--green),transparent_35%)] bg-[color-mix(in_oklab,var(--green),transparent_88%)]";
    if (status === "declared_spicy")
      return "border-[color-mix(in_oklab,var(--orange),transparent_25%)] bg-[color-mix(in_oklab,var(--orange),transparent_88%)]";
    if (status === "panic" || status === "glitch")
      return "border-[color-mix(in_oklab,var(--red),transparent_20%)] bg-[color-mix(in_oklab,var(--red),transparent_88%)]";
    return "border-white/12 bg-[color-mix(in_oklab,var(--card2),white_3%)]";
  };

  const TileIcon = ({ status }: { status: string }) => {
    if (status === "safe") return <span className="text-[color-mix(in_oklab,var(--green),white_8%)]">✓</span>;
    if (status === "declared_spicy") return <span className="text-[color-mix(in_oklab,var(--orange),white_10%)]">🔥</span>;
    if (status === "panic" || status === "glitch") return <span className="text-[color-mix(in_oklab,var(--red),white_10%)]">✕</span>;
    return (
      <span className="text-white/35" aria-hidden="true">
        🍴
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <NeonCard className="relative overflow-hidden p-6 sm:p-8" glow="green">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_320px_at_20%_0%,color-mix(in_oklab,var(--green),transparent_88%),transparent_62%),radial-gradient(900px_320px_at_90%_0%,color-mix(in_oklab,var(--orange),transparent_88%),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Room</Badge>
            <Badge tone="orange">{code}</Badge>
            {!room.canMultiplayer ? <Badge tone="neutral">Single device</Badge> : null}
            {room.isHost ? <Badge tone="orange">HOST</Badge> : null}
          </div>
          <div className="text-2xl font-black tracking-tight sm:text-3xl">Not a Glitch</div>
          <div className="text-sm text-[var(--muted)]">
            12 bites. 2 are extra spicy. Guess first. Eat fast. Survive the protocol.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Badge tone="neutral">You: {room.self.name}</Badge>
              <Badge tone="neutral">{room.players.length} players</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/game/results/${code}?name=${encodeURIComponent(room.self.name)}`}>
                <Button disabled={game?.phase !== "finished"}>Results</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => room.dispatch({ a: "reset" })}
                disabled={!game}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </NeonCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <NeonCard className="p-6 lg:col-span-2" glow="orange">
          {!game ? (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <div className="text-xs font-black tracking-widest text-[var(--muted)]">
                  WHO STARTS
                </div>
                <select
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black outline-none"
                  value={startPlayerId}
                  onChange={(e) => setStartPlayerId(e.target.value)}
                >
                  {room.players.slice(0, 4).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                size="lg"
                disabled={!room.isHost || room.players.length < 2}
                onClick={() => {
                  const playerOrder = room.players.slice(0, 4).map((p) => p.id);
                  room.dispatch({
                    a: "init",
                    betAmountCents: 0,
                    startPlayerId,
                    playerOrder,
                  });
                }}
              >
                {room.isHost ? "Create match" : "Waiting for host"}
              </Button>

              <div className="text-xs text-[var(--muted)]">
                Tip: max 4 players is recommended (like your spec).
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
                <div className="text-sm font-black tracking-wide text-[color-mix(in_oklab,var(--red),white_6%)]">
                  Safety disclaimer
                </div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  This game involves extremely spicy peppers. By playing you confirm all
                  participants are over 18+, have no heart or respiratory conditions, and are not
                  allergic to capsaicin. Handle with care.
                </div>
              </div>
            </div>
          ) : game.phase === "wager" ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-sm font-black tracking-wide">Choose what you play for</div>
                <div className="mt-1 text-xs text-[var(--muted)]">Host picks the wager.</div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {(
                  [
                    { id: "hot-seat", desc: wagerDescription("hot-seat") },
                    { id: "appetizer", desc: wagerDescription("appetizer") },
                    { id: "dare", desc: wagerDescription("dare") },
                    { id: "glitch", desc: wagerDescription("glitch") },
                  ] as const
                ).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    disabled={!room.isHost}
                    onClick={() => room.dispatch({ a: "set_wager", wager: w.id })}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-left transition",
                      "border-white/10 bg-white/5 hover:bg-white/8",
                      !room.isHost && "opacity-60",
                    )}
                  >
                    <div className="text-sm font-black">{wagerLabel(w.id)}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black tracking-wide">Match board</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Bite {game.biteIndex + 1}/12 •{" "}
                    <span className="font-black text-white">{currentPlayer?.name ?? "—"}</span>{" "}
                    eats now
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{game.wager ? wagerLabel(game.wager) : "Wager"}</Badge>
                  <Badge tone={hotRemaining === 0 ? "neutral" : "orange"}>
                    {hotRemaining} HOT remaining
                  </Badge>
                </div>
              </div>

              <NeonCard
                className="relative overflow-hidden p-4"
                glow={hotRemaining === 0 ? "none" : hotOddsPct !== null && hotOddsPct >= 40 ? "orange" : "green"}
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_260px_at_20%_0%,color-mix(in_oklab,var(--orange),transparent_90%),transparent_60%),radial-gradient(900px_260px_at_90%_0%,color-mix(in_oklab,var(--green),transparent_90%),transparent_60%)]"
                  aria-hidden="true"
                />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black tracking-widest text-[var(--muted)]">
                        LIVE ODDS
                      </div>
                      <div className="mt-1 text-sm font-black">Chance next bite is HOT</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black leading-none text-[color-mix(in_oklab,var(--orange),white_10%)] tabular-nums">
                        {hotOddsPct === null ? "—" : `${hotOddsPct}%`}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-[var(--muted)] tabular-nums">
                        {hotRemaining}/{bitesRemaining} remaining
                      </div>
                    </div>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${hotOddsPct ?? 0}%`,
                        background:
                          "linear-gradient(90deg,var(--green),var(--orange),var(--red),var(--yellow))",
                      }}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="text-xs text-[var(--muted)]">
                    Updates after each “Mediocre / Bombay Burner” confirmation.
                  </div>
                </div>
              </NeonCard>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-black tracking-widest text-[var(--muted)]">
                  WHAT YOU PLAY FOR
                </div>
                <div className="mt-2 text-sm font-black">
                  {game.wager ? wagerLabel(game.wager) : "Waiting for host…"}
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  {game.wager ? wagerDescription(game.wager) : "Host chooses the wager before the first bite."}
                </div>
              </div>

              {game.declaredSpicy && !isEater ? (
                <div className="rounded-2xl border border-[color-mix(in_oklab,var(--red),transparent_15%)] bg-[color-mix(in_oklab,var(--red),transparent_86%)] p-4 text-sm font-black text-[color-mix(in_oklab,var(--red),white_10%)]">
                  HOT declared — watch for facial expressions.
                </div>
              ) : null}

              <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                {protocol.map((e) => (
                  <div
                    key={e.biteIndex}
                    className={cn(
                      "aspect-square rounded-2xl border grid place-items-center text-base font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",
                      protocolTone(e.status),
                      e.biteIndex === game.biteIndex
                        ? "ring-2 ring-[color-mix(in_oklab,var(--yellow),white_10%)]"
                        : "",
                    )}
                    title={e.playerName ? `${e.playerName}: ${e.status}` : e.status}
                  >
                    <TileIcon status={e.status} />
                  </div>
                ))}
              </div>

              {game.phase === "guess" ? (
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-black">Guess: Bombay Burner or Mediocre?</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      variant="danger"
                      onClick={() => room.dispatch({ a: "guess", guess: "stark" })}
                      disabled={!!myGuess}
                    >
                      🌶️ Bombay Burner
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => room.dispatch({ a: "guess", guess: "mesig" })}
                      disabled={!!myGuess}
                    >
                      ✓ Mediocre
                    </Button>
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {allGuessed ? "All guesses in. Countdown starting…" : "Everyone must guess."}
                  </div>
                </div>
              ) : null}

              {game.phase === "countdown" ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <div className="text-xs font-black tracking-widest text-[var(--muted)]">
                    EATING IN
                  </div>
                  <div className="mt-2 text-5xl font-black text-[color-mix(in_oklab,var(--orange),white_10%)]">
                    {Math.max(0, Math.ceil(((game.countdownEndsAt ?? 0) - now) / 1000))}
                  </div>
                </div>
              ) : null}

              {game.phase === "eat" ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                    <div className="text-xs font-black tracking-widest text-[var(--muted)]">
                      TIME LEFT
                    </div>
                    <div
                      className={cn(
                        "mt-2 text-5xl font-black",
                        (secsLeft ?? 0) <= 5
                          ? "text-[color-mix(in_oklab,var(--yellow),white_10%)]"
                          : "text-[color-mix(in_oklab,var(--orange),white_10%)]",
                      )}
                    >
                      {Math.max(0, Math.ceil(((game.eatEndsAt ?? 0) - now) / 1000))}
                    </div>
                  </div>

                  {isEater ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Button size="lg" onClick={() => room.dispatch({ a: "finish_eat" })}>
                        I ate it
                      </Button>
                      <Button size="lg" variant="danger" onClick={() => room.dispatch({ a: "panic" })}>
                        I give up (DRINK)
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="text-sm font-black">Watch the eater</div>
                      <div className="text-xs text-[var(--muted)]">
                        If you see a grimace, hit the button. When 2+ people press it, it counts as a flinch.
                      </div>
                      <Button
                        size="lg"
                        variant="danger"
                        onClick={() => room.dispatch({ a: "judge_vote", vote: "yes" })}
                        disabled={!!game.judgeVotes[room.self.id]}
                      >
                        YOU FLINCHED
                      </Button>
                      <div className="text-xs text-[var(--muted)]">
                        Votes:{" "}
                        {order
                          .filter((pid) => pid !== currentPlayerId)
                          .map((pid) => (game.judgeVotes[pid] ? "✓" : "—"))
                          .join(" ")}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setCameraOpen(true)}
                    className="w-full"
                  >
                    Record with filter
                  </Button>

                  <div className="text-xs text-[var(--muted)]">
                    Red/yellow only appears during spicy moments (declare/panic/glitch).
                  </div>
                </div>
              ) : null}

              {game.phase === "confirm" ? (
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-black">What was it?</div>
                  <div className="text-xs text-[var(--muted)]">
                    This updates the board live and the odds of drawing a hot bite.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      onClick={() => room.dispatch({ a: "confirm_bite", biteType: "mild" })}
                      disabled={!isEater}
                    >
                      ✓ Mediocre
                    </Button>
                    <Button
                      size="lg"
                      variant="danger"
                      onClick={() => room.dispatch({ a: "confirm_bite", biteType: "hot" })}
                      disabled={!isEater}
                    >
                      🌶️ Bombay Burner
                    </Button>
                  </div>
                </div>
              ) : null}

              {game.phase === "judge" ? (
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-black">Time is up — judge the bite</div>
                  <div className="text-xs text-[var(--muted)]">
                    Everyone except the eater votes.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      onClick={() => room.dispatch({ a: "judge_vote", vote: "no" })}
                      disabled={room.self.id === currentPlayerId || !!game.judgeVotes[room.self.id]}
                    >
                      ✓ Klarade
                    </Button>
                    <Button
                      size="lg"
                      variant="danger"
                      onClick={() => room.dispatch({ a: "judge_vote", vote: "yes" })}
                      disabled={room.self.id === currentPlayerId || !!game.judgeVotes[room.self.id]}
                    >
                      🌶️ Flinchade
                    </Button>
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Votes:{" "}
                    {order
                      .filter((pid) => pid !== currentPlayerId)
                      .map((pid) => (game.judgeVotes[pid] ? "✓" : "—"))
                      .join(" ")}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </NeonCard>

        <NeonCard className="p-6" glow="green">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-black tracking-wide">Scoreboard</div>
              <div className="mt-1 text-xs text-[var(--muted)]">Safe • Glitched • Points</div>
            </div>
            <div
              className="h-1 w-24 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg,var(--green),var(--orange),var(--red),var(--yellow))",
              }}
              aria-hidden="true"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--card2),white_2%)]">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3 text-[11px] font-black tracking-widest text-[var(--muted)]">
              <div>PLAYER</div>
              <div className="text-right">SAFE</div>
              <div className="text-right">FLINCH</div>
              <div className="text-right">PTS</div>
            </div>
            <div className="h-px bg-white/10" />

            {room.players.slice(0, 4).map((p) => {
              const s = game?.scores[p.id] ?? { safe: 0, glitched: 0, betPoints: 0 };
              const isNow =
                p.id === currentPlayerId &&
                game &&
                ["guess", "countdown", "eat", "confirm", "judge"].includes(game.phase);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "relative overflow-hidden grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3",
                    "border-l-2",
                    isNow ? "border-l-[var(--yellow)] bg-white/6" : "border-l-transparent",
                  )}
                >
                  {isNow ? (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.14]"
                      style={{
                        background:
                          "linear-gradient(90deg,var(--green),var(--orange),var(--red),var(--yellow))",
                      }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="grid h-8 w-8 place-items-center rounded-xl border border-white/12 bg-white/6 text-xs font-black"
                        aria-hidden="true"
                      >
                        {p.name.trim().slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{p.name}</div>
                        {isNow ? (
                          <div className="text-xs font-semibold text-[color-mix(in_oklab,var(--yellow),white_10%)]">
                            NOW
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-[var(--muted)]">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm font-black text-[color-mix(in_oklab,var(--green),white_8%)] tabular-nums">
                    {s.safe}
                  </div>
                  <div className="text-right text-sm font-black text-[color-mix(in_oklab,var(--red),white_8%)] tabular-nums">
                    {s.glitched}
                  </div>
                  <div className="text-right text-sm font-black text-[color-mix(in_oklab,var(--orange),white_8%)] tabular-nums">
                    {s.betPoints}
                  </div>
                </div>
              );
            })}
          </div>
        </NeonCard>
      </div>

      <CameraRecorder open={cameraOpen} onOpenChange={setCameraOpen} />
    </div>
  );
}

