"use client";

import * as React from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import type {
  Guess,
  JudgeVote,
  NotAGlitchState,
  ProtocolEntry,
  ProtocolStatus,
  RoomPlayer,
  WagerType,
} from "../lib/types";
import { randomGlitchyBites } from "../lib/game";
import { safeId } from "../lib/utils";
import { getDb } from "../lib/firebase";
import { ONLINE_MULTIPLAYER_AVAILABLE } from "../lib/multiplayerEnv";
import {
  recordSpicySessionEnd,
  recordSpicySessionStart,
  upsertSpicyRoomSnapshot,
} from "../lib/spicyTelemetry";

function normalizeGameState(state: NotAGlitchState): NotAGlitchState {
  // Older Firestore docs may omit optional fields; normalize to nulls so writes never include undefined.
  return {
    ...state,
    wager: state.wager ?? null,
    judgeVerdict: state.judgeVerdict ?? null,
    countdownEndsAt: state.countdownEndsAt ?? null,
    eatEndsAt: state.eatEndsAt ?? null,
  };
}

function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null) return value;
  if (Array.isArray(value)) return value.map(stripUndefinedDeep) as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out as T;
  }
  return value;
}

type Msg =
  | { t: "who_is_here"; from: string }
  | { t: "i_am"; player: RoomPlayer }
  | { t: "join"; player: RoomPlayer }
  | { t: "leave"; playerId: string }
  | { t: "request_state"; from: string }
  | { t: "state"; state: NotAGlitchState }
  | { t: "action"; from: string; action: RoomAction };

type RoomAction =
  | { a: "init"; betAmountCents: number; startPlayerId: string; playerOrder: string[] }
  | { a: "set_wager"; wager: WagerType }
  | { a: "guess"; guess: Guess }
  | { a: "declare_spicy" }
  | { a: "start_eat" }
  | { a: "panic" }
  | { a: "finish_eat" }
  | { a: "confirm_bite"; biteType: "mild" | "hot" }
  | { a: "judge_vote"; vote: JudgeVote }
  | { a: "reset" };

export type RoomState = {
  self: RoomPlayer;
  players: RoomPlayer[];
  canMultiplayer: boolean;
  isHost: boolean;
  game: NotAGlitchState | null;
  dispatch: (action: RoomAction) => void;
};

export type RoomMode = "local" | "online";

export type UseRoomOptions = {
  isHostHint?: boolean;
  mode?: RoomMode;
};

function uniqPlayers(players: RoomPlayer[]) {
  const map = new Map<string, RoomPlayer>();
  for (const p of players) map.set(p.id, p);
  return Array.from(map.values()).sort((a, b) => a.joinedAt - b.joinedAt);
}

function makeInitialProtocol(): ProtocolEntry[] {
  return Array.from({ length: 12 }).map((_, i) => ({
    biteIndex: i,
    status: "pending" as const,
  }));
}

function nextPlayerIndex(state: NotAGlitchState) {
  return (state.currentPlayerIndex + 1) % Math.max(1, state.playerOrder.length);
}

function ensureScores(state: NotAGlitchState, players: RoomPlayer[]) {
  const next = { ...state.scores };
  for (const p of players) {
    if (!next[p.id]) next[p.id] = { safe: 0, glitched: 0, betPoints: 0 };
  }
  return next;
}

function setProtocol(
  state: NotAGlitchState,
  biteIndex: number,
  patch: Partial<ProtocolEntry>,
  player?: RoomPlayer,
) {
  const next = state.protocol.map((e) =>
    e.biteIndex === biteIndex
      ? {
          ...e,
          ...patch,
          playerId: player?.id ?? e.playerId,
          playerName: player?.name ?? e.playerName,
        }
      : e,
  );
  return next;
}

function applyHostAction(
  state: NotAGlitchState,
  players: RoomPlayer[],
  actorId: string,
  action: RoomAction,
): NotAGlitchState {
  state = normalizeGameState(state);
  const playerMap = new Map(players.map((p) => [p.id, p] as const));
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  const currentPlayer = currentPlayerId ? playerMap.get(currentPlayerId) : undefined;

  const scores = ensureScores(state, players);
  const voters = state.playerOrder.filter((pid) => pid !== currentPlayerId);
  const flinchByVotes = (judgeVotes: Record<string, JudgeVote>) => {
    const yes = voters.filter((pid) => judgeVotes[pid] === "yes").length;
    // With only 2 players there is 1 voter, so threshold must be 1.
    // With 3+ players, require 2 votes to avoid "single spectator decides" flinches.
    const threshold = voters.length <= 1 ? 1 : 2;
    return yes >= threshold;
  };

  switch (action.a) {
    case "init": {
      const order = action.playerOrder.length ? action.playerOrder : players.map((p) => p.id);
      const startIdx = Math.max(0, order.indexOf(action.startPlayerId));
      return {
        phase: "wager",
        hostId: actorId,
        betAmountCents: 0,
        wager: null,
        playerOrder: order,
        currentPlayerIndex: startIdx === -1 ? 0 : startIdx,
        biteIndex: 0,
        glitchyBites: randomGlitchyBites(),
        declaredSpicy: false,
        guesses: {},
        judgeVotes: {},
        judgeVerdict: null,
        protocol: makeInitialProtocol(),
        scores,
        countdownEndsAt: null,
        eatEndsAt: null,
      };
    }
    case "set_wager": {
      if (state.phase !== "wager") return state;
      // Guess phase removed. We wait in the "countdown" phase until the current
      // player presses "Start my turn" (start_eat action). No auto-start.
      return {
        ...state,
        wager: action.wager,
        phase: "countdown",
        countdownEndsAt: null,
      };
    }
    case "guess": {
      // Guess phase removed — kept as no-op so legacy clients can still dispatch.
      return state;
    }
    case "start_eat": {
      // The player whose turn it is starts their own 30-second clock.
      if (state.phase !== "countdown") return state;
      if (actorId !== currentPlayerId) return state;
      return {
        ...state,
        phase: "eat",
        countdownEndsAt: null,
        eatEndsAt: Date.now() + 30000,
      };
    }
    case "declare_spicy": {
      if (state.phase !== "eat") return state;
      if (actorId !== currentPlayerId) return state;
      if (state.declaredSpicy) return state;
      return {
        ...state,
        declaredSpicy: true,
        protocol: setProtocol(state, state.biteIndex, { status: "declared_spicy" }, currentPlayer),
      };
    }
    case "panic": {
      if (state.phase !== "eat") return state;
      if (actorId !== currentPlayerId) return state;
      const updatedScores = { ...scores };
      updatedScores[currentPlayerId] = {
        safe: updatedScores[currentPlayerId]?.safe ?? 0,
        glitched: (updatedScores[currentPlayerId]?.glitched ?? 0) + 1,
        betPoints: updatedScores[currentPlayerId]?.betPoints ?? 0,
      };
      const nextState: NotAGlitchState = {
        ...state,
        scores: updatedScores,
        protocol: setProtocol(
          state,
          state.biteIndex,
          { status: "panic", heat: undefined },
          currentPlayer,
        ),
        declaredSpicy: false,
        guesses: {},
        judgeVotes: {},
        judgeVerdict: null,
        countdownEndsAt: null,
        eatEndsAt: null,
      };
      const last = state.biteIndex >= 11;
      if (last) return { ...nextState, phase: "finished" };
      return {
        ...nextState,
        phase: "countdown",
        countdownEndsAt: null,
        biteIndex: state.biteIndex + 1,
        currentPlayerIndex: nextPlayerIndex(state),
      };
    }
    case "finish_eat": {
      if (state.phase !== "eat") return state;
      if (actorId !== currentPlayerId) return state;
      const verdictGlitch = flinchByVotes(state.judgeVotes);
      return {
        ...state,
        phase: "confirm",
        eatEndsAt: null,
        judgeVerdict: verdictGlitch ? "glitch" : "safe",
      };
    }
    case "confirm_bite": {
      if (state.phase !== "confirm") return state;
      // Note: the confirm phase is auto-resolved by the room page nowadays —
      // any client (typically the host) may dispatch this since the hot/mild
      // question was removed from the game.
      const isDeclared = state.declaredSpicy;
      const updatedScores = { ...scores };

      const biteHeat = action.biteType;

      // Betting: +1 for correct guess (hot=>stark, mild=>mesig). Everyone guessed already.
      const correctGuess: Guess = biteHeat === "hot" ? "stark" : "mesig";
      for (const pid of state.playerOrder) {
        if (state.guesses[pid] === correctGuess) {
          const prev = updatedScores[pid] ?? { safe: 0, glitched: 0, betPoints: 0 };
          updatedScores[pid] = { ...prev, betPoints: (prev.betPoints ?? 0) + 1 };
        }
      }

      // Auto-glitch rule: declared HOT but later says mild.
      const declaredWrong = isDeclared && biteHeat === "mild";
      const verdict = state.judgeVerdict ?? "safe";
      const finalGlitch = declaredWrong ? true : verdict === "glitch";

      const mePrev = updatedScores[currentPlayerId] ?? { safe: 0, glitched: 0, betPoints: 0 };
      updatedScores[currentPlayerId] = finalGlitch
        ? { ...mePrev, glitched: (mePrev.glitched ?? 0) + 1 }
        : { ...mePrev, safe: (mePrev.safe ?? 0) + 1 };

      // Bonus: if player declared HOT during 30s and it was HOT and they did NOT glitch.
      if (isDeclared && biteHeat === "hot" && !finalGlitch) {
        const cur = updatedScores[currentPlayerId]!;
        updatedScores[currentPlayerId] = { ...cur, betPoints: (cur.betPoints ?? 0) + 2 };
      }

      const status: ProtocolStatus = finalGlitch
        ? "glitch"
        : isDeclared && biteHeat === "hot"
          ? "declared_spicy"
          : "safe";

      const nextState: NotAGlitchState = {
        ...state,
        scores: updatedScores,
        protocol: setProtocol(
          state,
          state.biteIndex,
          { status, heat: biteHeat },
          currentPlayer,
        ),
        declaredSpicy: false,
        guesses: {},
        judgeVotes: {},
        judgeVerdict: null,
        countdownEndsAt: null,
        eatEndsAt: null,
      };

      const last = state.biteIndex >= 11;
      if (last) return { ...nextState, phase: "finished" };
      return {
        ...nextState,
        phase: "countdown",
        countdownEndsAt: null,
        biteIndex: state.biteIndex + 1,
        currentPlayerIndex: nextPlayerIndex(state),
      };
    }
    case "judge_vote": {
      if (state.phase !== "judge" && state.phase !== "eat") return state;
      if (actorId === currentPlayerId) return state;
      const judgeVotes = { ...state.judgeVotes, [actorId]: action.vote };
      const verdictGlitch = flinchByVotes(judgeVotes);

      // If we're still in the eating window, allow live voting and auto-lock once threshold is hit.
      if (state.phase === "eat") {
        if (!verdictGlitch) return { ...state, judgeVotes };
        return {
          ...state,
          judgeVotes,
          judgeVerdict: "glitch",
          phase: "confirm",
          eatEndsAt: null,
        };
      }

      // Legacy judge phase (kept): if host still uses it, we end on threshold or when all have voted.
      const allVoted = voters.every((pid) => judgeVotes[pid]);
      if (!allVoted && !verdictGlitch) return { ...state, judgeVotes };
      return {
        ...state,
        judgeVotes,
        judgeVerdict: verdictGlitch ? "glitch" : "safe",
        phase: "confirm",
      };
    }
    case "reset": {
      return {
        phase: "lobby",
        hostId: state.hostId,
        betAmountCents: state.betAmountCents,
        wager: null,
        playerOrder: state.playerOrder,
        currentPlayerIndex: 0,
        biteIndex: 0,
        glitchyBites: [],
        declaredSpicy: false,
        guesses: {},
        judgeVotes: {},
        judgeVerdict: null,
        protocol: makeInitialProtocol(),
        scores: {},
        countdownEndsAt: null,
        eatEndsAt: null,
      };
    }
  }
}

type RoomDoc = {
  code: string;
  status?: "open" | "finished";
  hostId?: string | null;
  players?: Record<string, RoomPlayer>;
  game?: NotAGlitchState | null;
  createdAt?: number;
  lastActiveAt?: number;
};

function useRoomFirestore(roomCode: string, name: string, isHostHint?: boolean): RoomState {
  const db = React.useMemo(() => getDb(), []);
  const roomRef = React.useMemo(() => doc(db, "spicyRooms", roomCode), [db, roomCode]);

  const [self] = React.useState<RoomPlayer>(() => ({
    id: safeId("p"),
    name: (name.trim() || "Player").slice(0, 28),
    joinedAt: Date.now(),
  }));

  const [players, setPlayers] = React.useState<RoomPlayer[]>([self]);
  const [game, setGame] = React.useState<NotAGlitchState | null>(null);
  const [hostId, setHostId] = React.useState<string | null>(isHostHint ? self.id : null);
  const isHost = hostId === self.id;
  const hostIdRef = React.useRef<string | null>(hostId);
  React.useEffect(() => {
    hostIdRef.current = hostId;
  }, [hostId]);

  const playersRef = React.useRef<RoomPlayer[]>([self]);
  const gameRef = React.useRef<NotAGlitchState | null>(null);
  React.useEffect(() => {
    playersRef.current = players;
  }, [players]);
  React.useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const sessionStartedAtRef = React.useRef<number | null>(null);
  const lastProcessedActionAtRef = React.useRef<number>(0);

  // Ensure room exists + join as player.
  React.useEffect(() => {
    let unsubRoom: Unsubscribe | null = null;
    let unsubActions: Unsubscribe | null = null;
    let alive = true;

    async function ensureAndListen() {
      await setDoc(
        roomRef,
        {
          code: roomCode,
          status: "open",
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        } satisfies RoomDoc,
        { merge: true },
      );

      // Upsert self into players map
      await updateDoc(roomRef, {
        [`players.${self.id}`]: self,
        lastActiveAt: Date.now(),
      }).catch(async () => {
        await setDoc(roomRef, { players: { [self.id]: self } }, { merge: true });
      });

      // Claim host if hint and room has no host yet (best effort).
      if (isHostHint) {
        await updateDoc(roomRef, { hostId: self.id }).catch(() => {});
      }

      unsubRoom = onSnapshot(roomRef, (snap) => {
        if (!alive) return;
        const data = snap.data() as RoomDoc | undefined;
        const map = data?.players ?? {};
        const list = uniqPlayers(Object.values(map));
        setPlayers(list.length ? list : [self]);
        setGame(() => {
          const raw = (data?.game as NotAGlitchState | null) ?? null;
          return raw ? normalizeGameState(raw) : null;
        });
        setHostId((data?.hostId as string | null) ?? null);
      });

      // Host processes action queue.
      const actionsRef = collection(roomRef, "actions");
      unsubActions = onSnapshot(
        query(actionsRef, orderBy("createdAt", "asc")),
        (snap) => {
          if (!alive) return;
          // Only host applies actions and writes state.
          const currentHost = hostIdRef.current ?? (isHostHint ? self.id : null);
          if (currentHost !== self.id) return;

          const changes = snap.docChanges().filter((c) => c.type === "added");
          if (changes.length === 0) return;

          let cur = gameRef.current;
          const currentPlayers = playersRef.current;

          // Create lobby base if missing.
          if (!cur) {
            const sortedPlayers = uniqPlayers(currentPlayers);
            const defaultHost = sortedPlayers[0]?.id || self.id;
            cur = {
              phase: "lobby",
              hostId: currentHost ?? defaultHost,
              betAmountCents: 0,
              wager: null,
              playerOrder: sortedPlayers.map((p) => p.id),
              currentPlayerIndex: 0,
              biteIndex: 0,
              glitchyBites: [],
              declaredSpicy: false,
              guesses: {},
              judgeVotes: {},
              judgeVerdict: null,
              protocol: makeInitialProtocol(),
              scores: {},
              countdownEndsAt: null,
              eatEndsAt: null,
            };
          }

          let next = cur;
          for (const ch of changes) {
            const d = ch.doc.data() as { from: string; action: RoomAction; createdAt: number };
            if (!d?.createdAt) continue;
            if (d.createdAt <= lastProcessedActionAtRef.current) continue;
            lastProcessedActionAtRef.current = d.createdAt;
            next = applyHostAction(next, currentPlayers, d.from, d.action);
            // best effort cleanup
            void deleteDoc(ch.doc.ref).catch(() => {});
          }

          const safeNext = stripUndefinedDeep(normalizeGameState(next));
          void updateDoc(roomRef, {
            game: safeNext,
            hostId: currentHost,
            status: next.phase === "finished" ? "finished" : "open",
            lastActiveAt: Date.now(),
          }).catch(() => {});
        },
      );
    }

    void ensureAndListen().catch(() => {});

    return () => {
      alive = false;
      try {
        unsubRoom?.();
        unsubActions?.();
      } catch {
        // ignore
      }
    };
  }, [roomRef, roomCode, self, isHostHint]);

  const dispatch = React.useCallback(
    (action: RoomAction) => {
      const actionsRef = collection(roomRef, "actions");
      const createdAt = Date.now();
      void addDoc(actionsRef, { from: self.id, action, createdAt }).catch(() => {});

      if (action.a === "init" && isHost) {
        sessionStartedAtRef.current = createdAt;
        void recordSpicySessionStart({ code: roomCode, startedAt: createdAt }).catch(() => {});
      }
      if (action.a === "reset" && isHost) {
        sessionStartedAtRef.current = null;
      }
    },
    [roomRef, self.id, roomCode, isHost],
  );

  // Telemetry snapshots for admin dashboard (host only; debounced).
  const lastSnapshotAtRef = React.useRef<number>(0);
  React.useEffect(() => {
    if (!isHost) return;
    const t = Date.now();
    if (t - lastSnapshotAtRef.current < 1500) return;
    lastSnapshotAtRef.current = t;
    void upsertSpicyRoomSnapshot({ code: roomCode, players, game }).catch(() => {});
  }, [isHost, roomCode, players, game]);

  React.useEffect(() => {
    if (!isHost) return;
    if (game?.phase !== "finished") return;
    const startedAt = sessionStartedAtRef.current;
    if (!startedAt) return;
    sessionStartedAtRef.current = null;
    void recordSpicySessionEnd({ code: roomCode, startedAt, endedAt: Date.now() }).catch(() => {});
  }, [isHost, roomCode, game?.phase]);

  // Timer progression handled by host: transition countdown -> eat -> confirm (auto-judge by votes).
  React.useEffect(() => {
    if (!isHost) return;
    if (!game) return;
    if (game.hostId !== self.id) return;

    // Countdown phase no longer auto-advances — the current player presses
    // "Start my turn" (start_eat action) when they're ready.

    if (game.phase === "eat" && game.eatEndsAt) {
      const ms = Math.max(0, game.eatEndsAt - Date.now());
      const t = window.setTimeout(() => {
        const cur = gameRef.current;
        if (!cur || cur.hostId !== self.id) return;
        if (cur.phase !== "eat") return;
        const voters = cur.playerOrder.filter((pid) => pid !== cur.playerOrder[cur.currentPlayerIndex]);
        const yes = voters.filter((pid) => cur.judgeVotes[pid] === "yes").length;
        const threshold = voters.length <= 1 ? 1 : 2;
        const verdictGlitch = yes >= threshold;
        const next: NotAGlitchState = {
          ...cur,
          phase: "confirm",
          eatEndsAt: null,
          judgeVerdict: verdictGlitch ? "glitch" : "safe",
        };
        void updateDoc(roomRef, { game: stripUndefinedDeep(normalizeGameState(next)), lastActiveAt: Date.now() }).catch(() => {});
      }, ms + 60);
      return () => window.clearTimeout(t);
    }
  }, [isHost, game, roomRef, self.id]);

  return {
    self,
    players,
    canMultiplayer: true,
    isHost,
    game,
    dispatch,
  };
}

export function useRoom(roomCode: string, name: string, options?: UseRoomOptions): RoomState {
  const mode = options?.mode ?? (ONLINE_MULTIPLAYER_AVAILABLE ? "online" : "local");
  const isHostHint = options?.isHostHint;
  // Never crash the room page when online is requested but not configured.
  // In that case we silently fall back to local mode.
  if (mode === "online" && !ONLINE_MULTIPLAYER_AVAILABLE) {
    return useRoomLocal(roomCode, name, isHostHint);
  }
  return mode === "online" ? useRoomFirestore(roomCode, name, isHostHint) : useRoomLocal(roomCode, name, isHostHint);
}

function useRoomLocal(roomCode: string, name: string, isHostHint?: boolean): RoomState {
  const [self] = React.useState<RoomPlayer>(() => {
    const storageKey = `glitchRoulette.room:${roomCode}.player`;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const obj = parsed as Record<string, unknown>;
          if (typeof obj.id === "string") {
            const next: RoomPlayer = {
              id: obj.id,
              name: (
                name.trim() ||
                (typeof obj.name === "string" ? obj.name : "") ||
                "Player"
              ).slice(0, 28),
              joinedAt: typeof obj.joinedAt === "number" ? obj.joinedAt : Date.now(),
            };
            sessionStorage.setItem(storageKey, JSON.stringify(next));
            return next;
          }
        }
      }
    } catch {
      // ignore
    }
    const created: RoomPlayer = {
      id: safeId("p"),
      name: (name.trim() || "Player").slice(0, 28),
      joinedAt: Date.now(),
    };
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(created));
    } catch {
      // ignore
    }
    return created;
  });
  const [players, setPlayers] = React.useState<RoomPlayer[]>(() => [self]);
  const [game, setGame] = React.useState<NotAGlitchState | null>(null);
  const channelRef = React.useRef<BroadcastChannel | null>(null);
  const canMultiplayer = typeof BroadcastChannel !== "undefined";
  const [isHost, setIsHost] = React.useState(Boolean(isHostHint));
  const playersRef = React.useRef<RoomPlayer[]>([self]);
  const sessionStartedAtRef = React.useRef<number | null>(null);
  const lastSnapshotAtRef = React.useRef<number>(0);

  React.useEffect(() => {
    playersRef.current = players;
  }, [players]);

  React.useEffect(() => {
    if (!canMultiplayer) return;
    const ch = new BroadcastChannel(`glitch-roulette-room:${roomCode}`);
    channelRef.current = ch;

    const post = (m: Msg) => ch.postMessage(m);

    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data as Msg;
      if (!msg || typeof msg !== "object") return;
      if (msg.t === "who_is_here") {
        if (msg.from === self.id) return;
        post({ t: "i_am", player: self });
        return;
      }
      if (msg.t === "i_am" || msg.t === "join") {
        const p = msg.player;
        setPlayers((prev) => uniqPlayers([...prev, p]));
        return;
      }
      if (msg.t === "leave") {
        setPlayers((prev) => prev.filter((p) => p.id !== msg.playerId));
        setGame((prev) => {
          if (!prev) return prev;
          const scores = { ...prev.scores };
          delete scores[msg.playerId];
          const guesses = { ...prev.guesses };
          delete guesses[msg.playerId];
          const judgeVotes = { ...prev.judgeVotes };
          delete judgeVotes[msg.playerId];
          const playerOrder = prev.playerOrder.filter((id) => id !== msg.playerId);
          const currentPlayerIndex = Math.min(prev.currentPlayerIndex, Math.max(0, playerOrder.length - 1));
          return { ...prev, scores, guesses, judgeVotes, playerOrder, currentPlayerIndex };
        });
        return;
      }
      if (msg.t === "request_state") {
        setGame((cur) => {
          if (!cur) return cur;
          if (cur.hostId !== self.id) return cur;
          post({ t: "state", state: cur });
          return cur;
        });
        return;
      }
      if (msg.t === "state") {
        setGame(msg.state);
        setIsHost((prev) => prev || msg.state.hostId === self.id);
        return;
      }
      if (msg.t === "action") {
        setGame((cur) => {
          const currentPlayers = playersRef.current;
          const sortedPlayers = uniqPlayers(currentPlayers);
          const defaultHost = sortedPlayers[0]?.id || self.id;
          const base =
            cur ??
            ({
              phase: "lobby",
              hostId: defaultHost,
              betAmountCents: 0,
              wager: null,
              playerOrder: currentPlayers.map((p) => p.id),
              currentPlayerIndex: 0,
              biteIndex: 0,
              glitchyBites: [],
              declaredSpicy: false,
              guesses: {},
              judgeVotes: {},
              judgeVerdict: null,
              protocol: makeInitialProtocol(),
              scores: {},
              countdownEndsAt: null,
              eatEndsAt: null,
            } satisfies NotAGlitchState);

          const sorted = sortedPlayers;
          const computedHost = base.hostId || defaultHost;
          const effective: NotAGlitchState = {
            ...base,
            hostId: computedHost,
            playerOrder: base.playerOrder.length ? base.playerOrder : sorted.map((p) => p.id),
          };

          // Only host applies actions; others just keep latest state.
          if (effective.hostId !== self.id) return cur ?? effective;

          const next = applyHostAction(effective, currentPlayers, msg.from, msg.action);
          post({ t: "state", state: next });
          return next;
        });
        return;
      }
    };

    ch.addEventListener("message", onMessage);

    post({ t: "join", player: self });
    post({ t: "who_is_here", from: self.id });
    post({ t: "request_state", from: self.id });

    return () => {
      try {
        post({ t: "leave", playerId: self.id });
      } catch {
        // ignore
      }
      ch.removeEventListener("message", onMessage);
      ch.close();
      channelRef.current = null;
    };
  }, [canMultiplayer, roomCode, self]);

  const dispatch = React.useCallback(
    (action: RoomAction) => {
      // Create initial lobby state if host and no state exists.
      setGame((cur) => {
        if (cur) return cur;
        if (!isHost && !isHostHint) return cur;
        const order = uniqPlayers(players).map((p) => p.id);
        const next: NotAGlitchState = {
          phase: "lobby",
          hostId: self.id,
          betAmountCents: 0,
          wager: null,
          playerOrder: order,
          currentPlayerIndex: 0,
          biteIndex: 0,
          glitchyBites: [],
          declaredSpicy: false,
          guesses: {},
          judgeVotes: {},
          judgeVerdict: null,
          protocol: makeInitialProtocol(),
          scores: {},
          countdownEndsAt: null,
          eatEndsAt: null,
        };
        channelRef.current?.postMessage({ t: "state", state: next } satisfies Msg);
        return next;
      });
      channelRef.current?.postMessage({ t: "action", from: self.id, action } satisfies Msg);

      // Firestore telemetry (best effort): host writes snapshots + sessions for admin dashboard.
      if (action.a === "init" && (isHost || isHostHint)) {
        const startedAt = Date.now();
        sessionStartedAtRef.current = startedAt;
        void recordSpicySessionStart({ code: roomCode, startedAt }).catch(() => {});
      }
    },
    [isHost, isHostHint, players, roomCode, self.id],
  );

  // Periodically upsert room snapshot from host (debounced).
  React.useEffect(() => {
    if (!isHost) return;
    const now = Date.now();
    if (now - lastSnapshotAtRef.current < 1500) return;
    lastSnapshotAtRef.current = now;
    void upsertSpicyRoomSnapshot({ code: roomCode, players, game }).catch(() => {});
  }, [isHost, roomCode, players, game]);

  // Mark session end when finished.
  React.useEffect(() => {
    if (!isHost) return;
    if (game?.phase !== "finished") return;
    const startedAt = sessionStartedAtRef.current;
    if (!startedAt) return;
    sessionStartedAtRef.current = null;
    void recordSpicySessionEnd({ code: roomCode, startedAt, endedAt: Date.now() }).catch(() => {});
  }, [isHost, roomCode, game?.phase]);

  // Local timer progression handled by host: transition countdown -> eat -> confirm (auto-judge by votes).
  React.useEffect(() => {
    if (!game) return;
    if (game.hostId !== self.id) return;
    // Countdown phase no longer auto-advances — the eater dispatches start_eat
    // when they tap "Start my turn", which transitions into the 30s eat phase.
    if (game.phase === "eat" && game.eatEndsAt) {
      const ms = Math.max(0, game.eatEndsAt - Date.now());
      const t = window.setTimeout(() => {
        setGame((cur) => {
          if (!cur || cur.hostId !== self.id) return cur;
          if (cur.phase !== "eat") return cur;
          const voters = cur.playerOrder.filter((pid) => pid !== cur.playerOrder[cur.currentPlayerIndex]);
          const yes = voters.filter((pid) => cur.judgeVotes[pid] === "yes").length;
          const threshold = voters.length <= 1 ? 1 : 2;
          const verdictGlitch = yes >= threshold;
          const next: NotAGlitchState = {
            ...cur,
            phase: "confirm",
            eatEndsAt: null,
            judgeVerdict: verdictGlitch ? "glitch" : "safe",
          };
          channelRef.current?.postMessage({ t: "state", state: next } satisfies Msg);
          return next;
        });
      }, ms + 40);
      return () => window.clearTimeout(t);
    }
  }, [game, self.id]);

  return { self, players, canMultiplayer, isHost, game, dispatch };
}

