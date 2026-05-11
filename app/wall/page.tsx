"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "../components/ui/Button";
import { NeonCard } from "../components/ui/NeonCard";
import { subscribeToWall, type WallPost } from "../lib/wall";

function relativeTime(ms: number): string {
  if (!ms) return "just now";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
}

export default function WallPage() {
  const [posts, setPosts] = React.useState<WallPost[] | null>(null);
  const [lightbox, setLightbox] = React.useState<WallPost | null>(null);

  React.useEffect(() => {
    const unsub = subscribeToWall((next) => setPosts(next), { max: 120 });
    return () => unsub();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <NeonCard className="p-5 sm:p-7" glow="orange">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
              Salud presents
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Wall of Flinchers
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              Every player who couldn’t hold a straight face ends up here. Take a photo from the
              camera in any room and tap{" "}
              <span className="font-black text-white">📌 Post to Wall of Flinchers</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/">
              <Button size="sm" variant="ghost">
                ← Back to game
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6">
          {posts === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-2xl border border-white/8 bg-white/5"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
              <div className="text-2xl">🔥</div>
              <div className="mt-2 text-sm font-black">No flinchers yet.</div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Be the first to post one — take a photo with the in-game camera.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {posts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightbox(p)}
                  className="group relative overflow-hidden rounded-2xl border border-white/12 bg-black/40 text-left transition hover:border-[color-mix(in_oklab,var(--orange),transparent_30%)]"
                >
                  <div className="aspect-square w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt={`${p.playerName} flinched`}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px]">
                    <div className="truncate font-black">{p.playerName}</div>
                    <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-white/70">
                      <span>{relativeTime(p.createdAt)}</span>
                      {p.roomCode ? (
                        <span className="rounded-full border border-white/15 bg-white/8 px-1.5 py-0.5 font-black tracking-wider">
                          {p.roomCode}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </NeonCard>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 z-10 rounded-xl border border-white/15 bg-black/65 px-3 py-1.5 text-xs font-black hover:bg-black/85"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              Close
            </button>
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.imageUrl}
                alt={`${lightbox.playerName} flinched`}
                className="max-h-[80vh] w-full object-contain"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <div className="font-black">{lightbox.playerName}</div>
                <div className="text-[11px] text-white/70">
                  {relativeTime(lightbox.createdAt)}
                  {lightbox.roomCode ? ` · room ${lightbox.roomCode}` : ""}
                </div>
              </div>
              <a
                href={lightbox.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs font-black hover:bg-white/12"
              >
                Open full size ↗
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
