"use client";

import { doc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { NotAGlitchState, RoomPlayer } from "./types";

function now() {
  return Date.now();
}

export async function upsertSpicyRoomSnapshot(args: {
  code: string;
  players: RoomPlayer[];
  game: NotAGlitchState | null;
}) {
  const db = getDb();
  const status = args.game?.phase === "finished" ? "finished" : "open";
  await setDoc(
    doc(db, "spicyRooms", args.code),
    {
      code: args.code,
      status,
      phase: args.game?.phase ?? "lobby",
      playerCount: args.players.length,
      createdAt: now(),
      lastActiveAt: now(),
    },
    { merge: true },
  );
}

export async function ensureSpicyRoom(args: {
  code: string;
  host?: RoomPlayer;
}) {
  const db = getDb();
  const host = args.host;
  await setDoc(
    doc(db, "spicyRooms", args.code),
    {
      code: args.code,
      status: "open",
      phase: "lobby",
      playerCount: host ? 1 : 0,
      createdAt: now(),
      lastActiveAt: now(),
      hostId: host?.id ?? null,
      players: host ? { [host.id]: host } : {},
      game: null,
    },
    { merge: true },
  );
}

export async function recordSpicySessionStart(args: {
  code: string;
  startedAt: number;
}) {
  const db = getDb();
  await setDoc(
    doc(db, "spicySessions", `${args.code}_${args.startedAt}`),
    { roomCode: args.code, startedAt: args.startedAt },
    { merge: true },
  );
}

export async function recordSpicySessionEnd(args: {
  code: string;
  startedAt: number;
  endedAt: number;
}) {
  const db = getDb();
  await setDoc(
    doc(db, "spicySessions", `${args.code}_${args.startedAt}`),
    { roomCode: args.code, startedAt: args.startedAt, endedAt: args.endedAt },
    { merge: true },
  );
}

