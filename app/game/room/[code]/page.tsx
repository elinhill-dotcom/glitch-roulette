"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { NeonCard } from "../../../components/ui/NeonCard";
import { CameraRecorder } from "../../../components/CameraRecorder";
import { RoomInvite } from "../../../components/RoomInvite";
import { cn } from "../../../lib/utils";
import { useRoom } from "../../../state/room";
import { wagerDescription, wagerLabel } from "../../../lib/game";
import {
  ONLINE_MULTIPLAYER_AVAILABLE,
  onlineMultiplayerDisabledReason,
} from "../../../lib/multiplayerEnv";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">{children}</div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/10" />;
}

export default function MultiplayerRoomPage() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = String(params.code ?? "").toUpperCase();
  const name = search.get("name") ?? "Player";
  const isHostHint = search.get("host") === "1";
  const modeParam = search.get("mode");
  // Multiplayer-first: default to online unless explicitly forced to local.
  const mode = modeParam === "local" ? "local" : "online";
  const onlineRequested = mode === "online";
  const disabledReason = onlineMultiplayerDisabledReason();
  const onlineActive = onlineRequested && ONLINE_MULTIPLAYER_AVAILABLE;

  const room = useRoom(code, name, { isHostHint, mode });
  const game = room.game;

  const [startPlayerId, setStartPlayerId] = React.useState<string>(room.self.id);

  const order = game?.playerOrder ?? room.players.map((p) => p.id);
  const currentPlayerId = game ? order[game.currentPlayerIndex] : null;
  const currentPlayer = room.players.find((p) => p.id === currentPlayerId) ?? null;
  const isEater = room.self.id === currentPlayerId;
  const [cameraOpen, setCameraOpen] = React.useState(false);

  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!game?.eatEndsAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [game?.eatEndsAt]);
  const secsLeft = game?.eatEndsAt ? Math.max(0, Math.ceil((game.eatEndsAt - now) / 1000)) : null;

  // Auto-resolve the per-bite confirm phase. The hot/mild question is gone — the
  // host silently confirms with "mild" so each bite ends with just the flinch verdict
  // and we move straight into the next countdown.
  const lastAutoConfirmedBiteRef = React.useRef<number>(-1);
  React.useEffect(() => {
    if (!room.isHost) return;
    if (!game) return;
    if (game.phase !== "confirm") return;
    if (lastAutoConfirmedBiteRef.current === game.biteIndex) return;
    lastAutoConfirmedBiteRef.current = game.biteIndex;
    room.dispatch({ a: "confirm_bite", biteType: "mild" });
  }, [room, game]);

  const protocol = game?.protocol ?? [];
  // Tile colour now reflects the only thing that matters: did the player flinch?
  const protocolTone = (e: { status: string }) => {
    if (e.status === "panic" || e.status === "glitch")
      return "border-[color-mix(in_oklab,var(--red),transparent_20%)] bg-[color-mix(in_oklab,var(--red),transparent_88%)]";
    if (e.status === "safe")
      return "border-[color-mix(in_oklab,var(--green),transparent_35%)] bg-[color-mix(in_oklab,var(--green),transparent_88%)]";
    return "border-white/12 bg-[color-mix(in_oklab,var(--card2),white_3%)]";
  };

  const TileIcon = ({ e }: { e: { status: string } }) => {
    if (e.status === "panic" || e.status === "glitch")
      return <span className="text-[color-mix(in_oklab,var(--red),white_12%)]">🥵</span>;
    if (e.status === "safe")
      return <span className="text-[color-mix(in_oklab,var(--green),white_12%)]">✓</span>;
    return <span className="text-white/35">🍴</span>;
  };

  const inMatch =
    !!game && game.phase !== "lobby" && game.phase !== "wager";

  return (
    <div className="flex flex-col gap-4">
      <NeonCard
        className={cn("relative overflow-hidden", inMatch ? "p-4 sm:p-6" : "p-5 sm:p-8")}
        glow="green"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_320px_at_15%_0%,color-mix(in_oklab,var(--green),transparent_88%),transparent_62%),radial-gradient(900px_320px_at_95%_100%,color-mix(in_oklab,var(--orange),transparent_88%),transparent_62%)]"
          aria-hidden="true"
        />

        <div className={cn("relative flex flex-col", inMatch ? "gap-4" : "gap-6")}>
          {/* IDENTITY — slim during active match, full in lobby/wager */}
          {inMatch ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="orange">{code}</Badge>
                {room.isHost ? <Badge tone="orange">HOST</Badge> : null}
                {onlineActive ? null : <Badge tone="neutral">LOCAL</Badge>}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCameraOpen(true)}
                  aria-label="Open camera to capture and share"
                >
                  📸 Camera
                </Button>
                <Link href="/wall">
                  <Button size="sm" variant="ghost" aria-label="Wall of Flinchers">
                    🔥 Wall
                  </Button>
                </Link>
                {game?.phase === "finished" ? (
                  <Link
                    href={`/game/results/${code}?name=${encodeURIComponent(room.self.name)}`}
                  >
                    <Button size="sm">Results</Button>
                  </Link>
                ) : null}
                {room.isHost ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => room.dispatch({ a: "reset" })}
                  >
                    Reset
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="green">Room</Badge>
                  <Badge tone="orange">{code}</Badge>
                  {!room.canMultiplayer ? <Badge tone="neutral">Single device</Badge> : null}
                  {room.isHost ? <Badge tone="orange">HOST</Badge> : null}
                  {onlineActive ? (
                    <Badge tone="green">ONLINE</Badge>
                  ) : (
                    <Badge tone="neutral">LOCAL</Badge>
                  )}
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  Not a Flinch
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  Whoever is up taps Start to begin their own 30-second clock. Watch them — if
                  they flinch, vote them out.
                </div>
              </div>
              {game ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/wall">
                    <Button size="sm" variant="ghost">
                      🔥 Wall
                    </Button>
                  </Link>
                  {room.isHost ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => room.dispatch({ a: "reset" })}
                    >
                      Reset
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {!onlineActive && !inMatch ? (
            <div className="rounded-xl border border-[color-mix(in_oklab,var(--yellow),transparent_35%)] bg-[color-mix(in_oklab,var(--yellow),transparent_88%)] p-3 text-xs">
              <span className="font-black">Online multiplayer not active.</span>{" "}
              Players won&apos;t see each other across networks unless Firestore is enabled.
              {disabledReason ? ` ${disabledReason}.` : ""}
            </div>
          ) : null}

          {!game ? (
            /* ============= LOBBY ============= */
            <>
              {/* PLAYERS */}
              <Divider />
              <div>
                <div className="flex items-center justify-between gap-3">
                  <SectionLabel>PLAYERS · {room.players.length}/4</SectionLabel>
                  <div className="text-[10px] font-black tracking-widest text-[var(--muted)]">
                    MIN 2 · MAX 4
                  </div>
                </div>
                <div className="mt-3 flex flex-col">
                  {room.players.slice(0, 4).map((p, i) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-3 py-2",
                        i > 0 ? "border-t border-white/5" : "",
                      )}
                    >
                      <div
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/6 text-xs font-black"
                        aria-hidden="true"
                      >
                        {p.name.trim().slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 truncate text-sm font-black">
                        {p.name}
                      </div>
                      {p.id === room.self.id ? <Badge tone="orange">YOU</Badge> : null}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 2 - room.players.length) }).map((_, i) => (
                    <div
                      key={`waiting-${i}`}
                      className={cn(
                        "flex items-center gap-3 py-2",
                        room.players.length + i > 0 ? "border-t border-white/5" : "",
                      )}
                    >
                      <div
                        className="h-9 w-9 shrink-0 rounded-xl border border-dashed border-white/15"
                        aria-hidden="true"
                      />
                      <div className="text-sm text-[var(--muted)]">
                        Waiting for a player to join…
                      </div>
                    </div>
                  ))}
                </div>
                {room.players.length < 2 ? (
                  <div className="mt-2 text-[11px] text-[var(--muted)]">
                    Minimum 2 players needed to start the match.
                  </div>
                ) : null}
              </div>

              {/* NEXT STEP */}
              <Divider />
              {room.isHost && room.players.length >= 2 ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <SectionLabel>READY TO PLAY</SectionLabel>
                    <div className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                      Start the match
                    </div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      Pick who takes the first bite, then start.
                    </div>
                  </div>

                  <label className="flex flex-col gap-2">
                    <SectionLabel>WHO STARTS</SectionLabel>
                    <select
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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
                    Start match · {room.players.length} player
                    {room.players.length === 1 ? "" : "s"}
                  </Button>

                  <div className="text-[11px] text-[var(--muted)]">
                    Need more friends? Share the invite — late joiners can still hop in before
                    the first bite.
                  </div>
                  <RoomInvite code={code} hostName={room.self.name} size="sm" />
                  <div className="text-[11px] text-[var(--muted)]">
                    Room code:{" "}
                    <span className="font-black tracking-[0.25em] text-white tabular-nums">
                      {code}
                    </span>
                  </div>
                </div>
              ) : room.isHost ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <SectionLabel>STEP 1 · INVITE YOUR FRIENDS</SectionLabel>
                    <div className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                      Send the link — they join in one tap
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      Tap <span className="font-black text-white">Share invite</span> to send the
                      room via SMS, Messenger, mail or any app. The link pre-fills the room code
                      for them.
                    </div>
                  </div>

                  <div>
                    <SectionLabel>ROOM CODE</SectionLabel>
                    <div className="mt-1 font-black tracking-[0.35em] text-3xl sm:text-4xl text-[color-mix(in_oklab,var(--orange),white_8%)] tabular-nums">
                      {code}
                    </div>
                  </div>

                  <RoomInvite code={code} hostName={room.self.name} size="lg" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <SectionLabel>YOU&apos;RE IN</SectionLabel>
                  <div className="text-xl font-black tracking-tight sm:text-2xl">
                    Waiting for host to start
                  </div>
                  <div className="text-sm leading-6 text-[var(--muted)]">
                    The host will tap{" "}
                    <span className="font-black text-white">Start match</span> once everyone is
                    in. Sit tight — the first bite is on its way.
                  </div>
                </div>
              )}

              {/* SAFETY */}
              <Divider />
              <div className="text-[11px] leading-5 text-[var(--muted)]">
                <span className="font-black text-[color-mix(in_oklab,var(--red),white_6%)]">
                  Safety:
                </span>{" "}
                Extremely spicy peppers. All participants confirm they are 18+, have no heart or
                respiratory conditions, and are not allergic to capsaicin.
              </div>
            </>
          ) : game.phase === "wager" ? (
            /* ============= WAGER PICK ============= */
            <>
              <Divider />
              <div className="flex flex-col gap-3">
                <div>
                  <SectionLabel>
                    {room.isHost ? "STEP 1 · PICK THE WAGER" : "WAITING ON HOST"}
                  </SectionLabel>
                  <div className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                    {room.isHost ? "What are you playing for?" : "Host is picking the wager…"}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
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
                        "rounded-xl border px-4 py-3 text-left transition",
                        "border-white/10 bg-white/5 hover:bg-white/8",
                        !room.isHost && "opacity-60",
                      )}
                    >
                      <div className="text-sm font-black">{wagerLabel(w.id)}</div>
                      <div className="mt-0.5 text-xs text-[var(--muted)]">{w.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ============= ACTIVE MATCH ============= */
            <>
              {/* TURN — merged BITE header + YOUR ACTION so the most important
                  information sits at the top of the screen on mobile. */}
              <div>
                <SectionLabel>BITE {game.biteIndex + 1} OF 12</SectionLabel>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-3xl font-black tracking-tight sm:text-4xl">
                    {currentPlayer?.name ?? "—"}
                  </span>
                  <span className="text-sm text-[var(--muted)]">is up</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {game.wager ? (
                    <Badge tone="neutral">Wager: {wagerLabel(game.wager)}</Badge>
                  ) : null}
                  <Badge tone={isEater ? "orange" : "neutral"}>
                    {isEater ? "YOU EAT" : "YOU WATCH"}
                  </Badge>
                </div>

                <div className="mt-4">
                {game.phase === "countdown" ? (
                  <div className="mt-2 flex flex-col gap-3">
                    {isEater ? (
                      <>
                        <div className="text-sm font-black">
                          You&apos;re up — take the bite, then tap Start to begin your 30s.
                        </div>
                        <Button
                          size="lg"
                          onClick={() => room.dispatch({ a: "start_eat" })}
                        >
                          ▶ Start my 30s
                        </Button>
                        <div className="text-[11px] text-[var(--muted)]">
                          The other players are watching for flinches.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-black">
                          Waiting for {currentPlayer?.name ?? "the eater"} to start.
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          They control the clock — when they tap Start you’ll see the 30-second
                          timer. Watch their face: tap{" "}
                          <span className="font-black text-white">“They flinched”</span> if it
                          cracks. If your mates think it’s ok, open the{" "}
                          <button
                            type="button"
                            onClick={() => setCameraOpen(true)}
                            className="font-black text-[color-mix(in_oklab,var(--orange),white_10%)] underline-offset-2 hover:underline"
                          >
                            📸 Camera
                          </button>{" "}
                          and post the moment to the{" "}
                          <Link
                            href="/wall"
                            className="font-black text-[color-mix(in_oklab,var(--orange),white_10%)] underline-offset-2 hover:underline"
                          >
                            Wall of Flinchers
                          </Link>{" "}
                          or on your social channels.
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {game.phase === "eat" ? (
                  <div className="mt-2 flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                        TIME LEFT
                      </div>
                      <div
                        className={cn(
                          "text-5xl font-black tabular-nums",
                          (secsLeft ?? 0) <= 5
                            ? "text-[color-mix(in_oklab,var(--yellow),white_10%)]"
                            : "text-[color-mix(in_oklab,var(--orange),white_10%)]",
                        )}
                      >
                        {secsLeft ?? 0}
                      </div>
                    </div>
                    {isEater ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button size="lg" onClick={() => room.dispatch({ a: "finish_eat" })}>
                          I survived
                        </Button>
                        <Button
                          size="lg"
                          variant="danger"
                          onClick={() => room.dispatch({ a: "panic" })}
                        >
                          I flinched (DRINK)
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="text-sm">
                          See a grimace? Tap the button — 2+ votes counts as a flinch.
                        </div>
                        <Button
                          size="lg"
                          variant="danger"
                          onClick={() => room.dispatch({ a: "judge_vote", vote: "yes" })}
                          disabled={!!game.judgeVotes[room.self.id]}
                        >
                          They flinched
                        </Button>
                        <div className="text-[11px] text-[var(--muted)]">
                          Votes:{" "}
                          {order
                            .filter((pid) => pid !== currentPlayerId)
                            .map((pid) => (game.judgeVotes[pid] ? "✓" : "—"))
                            .join(" ")}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {game.phase === "judge" ? (
                  <div className="mt-2 flex flex-col gap-3">
                    <div className="text-sm font-black">
                      Time&apos;s up — did they flinch?
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      Everyone except the eater votes.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        size="lg"
                        onClick={() => room.dispatch({ a: "judge_vote", vote: "no" })}
                        disabled={
                          room.self.id === currentPlayerId ||
                          !!game.judgeVotes[room.self.id]
                        }
                      >
                        ✓ Survived
                      </Button>
                      <Button
                        size="lg"
                        variant="danger"
                        onClick={() => room.dispatch({ a: "judge_vote", vote: "yes" })}
                        disabled={
                          room.self.id === currentPlayerId ||
                          !!game.judgeVotes[room.self.id]
                        }
                      >
                        🥵 Flinched
                      </Button>
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      Votes:{" "}
                      {order
                        .filter((pid) => pid !== currentPlayerId)
                        .map((pid) => (game.judgeVotes[pid] ? "✓" : "—"))
                        .join(" ")}
                    </div>
                  </div>
                ) : null}

                {game.phase === "confirm" ? (
                  <div className="mt-2 text-sm text-[var(--muted)]">Resolving bite…</div>
                ) : null}

                {game.phase === "finished" ? (
                  <div className="mt-2 flex flex-col gap-3">
                    <div className="text-sm font-black">Match finished.</div>
                    <Link
                      href={`/game/results/${code}?name=${encodeURIComponent(room.self.name)}`}
                    >
                      <Button size="lg">View results</Button>
                    </Link>
                  </div>
                ) : null}
                </div>
              </div>

              {/* TURN ORDER — every bite shows the eater and how it went.
                  Past bites get their flinch/safe colour, upcoming bites stay
                  neutral, current bite has a yellow ring. */}
              <Divider />
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <SectionLabel>TURN ORDER</SectionLabel>
                  <span className="text-[10px] font-black tracking-widest text-[var(--muted)]">
                    {game.biteIndex}/12 played
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
                  {protocol.map((e) => {
                    const isPast = e.biteIndex < game.biteIndex;
                    const isNow = e.biteIndex === game.biteIndex;
                    // Project the eater for current/future bites from the turn order.
                    let name = e.playerName;
                    if (!name) {
                      const offset = e.biteIndex - game.biteIndex;
                      const idx =
                        (game.currentPlayerIndex + offset) %
                        Math.max(1, game.playerOrder.length);
                      const pid = game.playerOrder[idx];
                      name = room.players.find((p) => p.id === pid)?.name ?? "—";
                    }
                    return (
                      <div
                        key={e.biteIndex}
                        className={cn(
                          "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-center",
                          isPast
                            ? protocolTone(e)
                            : "border-white/12 bg-[color-mix(in_oklab,var(--card2),white_3%)]",
                          isNow
                            ? "ring-2 ring-[color-mix(in_oklab,var(--yellow),white_10%)]"
                            : "",
                        )}
                        title={`Bite ${e.biteIndex + 1} · ${name}${isPast ? ` · ${e.status}` : ""}`}
                      >
                        <div className="text-xl leading-none">
                          {isPast ? (
                            <TileIcon e={e} />
                          ) : isNow ? (
                            <span className="text-[color-mix(in_oklab,var(--yellow),white_10%)]">
                              ●
                            </span>
                          ) : (
                            <span className="text-sm text-white/40">
                              {e.biteIndex + 1}
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            "w-full truncate text-sm font-black leading-tight",
                            isNow
                              ? "text-[color-mix(in_oklab,var(--yellow),white_10%)]"
                              : isPast
                                ? "text-white/95"
                                : "text-white/55",
                          )}
                        >
                          {name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </NeonCard>

      <CameraRecorder
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        playerName={room.self.name}
        roomCode={code}
      />
    </div>
  );
}
