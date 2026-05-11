"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "../components/ui/Button";
import { NeonCard } from "../components/ui/NeonCard";
import { subscribeToWall, uploadFlinchPhoto, type WallPost } from "../lib/wall";

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

const PLATFORMS = [
  { name: "Facebook", icon: "📘" },
  { name: "Instagram", icon: "📷" },
  { name: "Snapchat", icon: "👻" },
  { name: "TikTok", icon: "🎵" },
] as const;

type Platform = (typeof PLATFORMS)[number]["name"];

async function shareWallPostToPlatform(post: WallPost, platform: Platform) {
  try {
    const res = await fetch(post.imageUrl);
    const blob = await res.blob();
    const file = new File([blob], "not-a-flinch.jpg", { type: blob.type || "image/jpeg" });
    if ("share" in navigator) {
      const canShare =
        "canShare" in navigator ? navigator.canShare?.({ files: [file] }) : false;
      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: "Not a Flinch · Wall of Flinchers",
            text: `${post.playerName} flinched at Salud — share to ${platform} 🔥`,
          });
          return { kind: "shared" } as const;
        } catch {
          // user cancelled the native sheet
        }
      }
    }
  } catch {
    // fall through to platform-specific fallback
  }

  if (platform === "Facebook") {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.imageUrl)}`,
      "_blank",
      "noopener,noreferrer",
    );
    return { kind: "opened-fb" } as const;
  }

  // Desktop fallback for IG / Snap / TikTok — download so the user can upload manually.
  const a = document.createElement("a");
  a.href = post.imageUrl;
  a.download = `not-a-flinch-${post.id}.jpg`;
  a.click();
  return {
    kind: "downloaded",
    hint: `Image saved. Open ${platform} on your phone and upload it from your gallery.`,
  } as const;
}

export default function WallPage() {
  const [posts, setPosts] = React.useState<WallPost[] | null>(null);
  const [lightbox, setLightbox] = React.useState<WallPost | null>(null);
  const [lightboxHint, setLightboxHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = subscribeToWall((next) => setPosts(next), { max: 120 });
    return () => unsub();
  }, []);

  // Upload from the wall page itself.
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploaderName, setUploaderName] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<"idle" | "ok" | "error">(
    "idle",
  );
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setUploaderName(window.localStorage.getItem("notAFlinch.uploaderName") ?? "");
  }, []);

  const handleFile = React.useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadStatus("error");
        setUploadError("Please choose an image file (JPEG or PNG).");
        return;
      }
      setUploading(true);
      setUploadStatus("idle");
      setUploadError(null);
      try {
        const name = (uploaderName.trim() || "Anonymous").slice(0, 40);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("notAFlinch.uploaderName", name);
        }
        await uploadFlinchPhoto({ blob: file, playerName: name });
        setUploadStatus("ok");
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : "Upload failed. Check your connection and try again.";
        setUploadStatus("error");
        setUploadError(msg);
      } finally {
        setUploading(false);
      }
    },
    [uploaderName],
  );

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
              Every player who couldn’t hold a straight face ends up here. Upload your own moment
              below, or take one with the in-game{" "}
              <span className="font-black text-white">📸 Camera</span>.
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

        {/* UPLOAD CARD */}
        <div className="mt-5 rounded-2xl border border-white/12 bg-white/4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-black tracking-widest text-[var(--muted)]">
                YOUR NAME
              </span>
              <input
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="e.g. Elin"
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold outline-none focus:border-white/18 focus:ring-2 focus:ring-[var(--ring)]"
                maxLength={40}
              />
            </label>
            <div className="flex gap-2">
              <Button
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "📸 Upload photo"}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void handleFile(f);
              }}
            />
          </div>
          {uploadStatus === "ok" ? (
            <div className="mt-3 rounded-xl border border-[color-mix(in_oklab,var(--green),transparent_50%)] bg-[color-mix(in_oklab,var(--green),transparent_88%)] px-3 py-2 text-xs font-black">
              Posted to the wall — refresh below if it isn’t visible yet.
            </div>
          ) : null}
          {uploadStatus === "error" && uploadError ? (
            <div className="mt-3 rounded-xl border border-[color-mix(in_oklab,var(--red),transparent_45%)] bg-[color-mix(in_oklab,var(--red),transparent_88%)] px-3 py-2 text-xs">
              <div className="font-black">Upload failed</div>
              <div className="mt-0.5 text-[var(--muted)]">{uploadError}</div>
            </div>
          ) : null}
          <div className="mt-2 text-[11px] text-[var(--muted)]">
            Phones with camera will be asked to allow the gallery + camera. Photos are public on
            this wall.
          </div>
        </div>

        {/* GRID */}
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
                Be the first — upload one above or take one with the in-game camera.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {posts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setLightbox(p);
                    setLightboxHint(null);
                  }}
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

      {/* LIGHTBOX */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur"
          onClick={() => {
            setLightbox(null);
            setLightboxHint(null);
          }}
        >
          <div
            className="relative w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 z-10 rounded-xl border border-white/15 bg-black/65 px-3 py-1.5 text-xs font-black hover:bg-black/85"
              onClick={() => {
                setLightbox(null);
                setLightboxHint(null);
              }}
              aria-label="Close"
            >
              Close
            </button>
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.imageUrl}
                alt={`${lightbox.playerName} flinched`}
                className="max-h-[70vh] w-full object-contain"
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

            <div className="mt-3 text-[10px] font-black tracking-widest text-white/70">
              SHARE TO
            </div>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {PLATFORMS.map(({ name, icon }) => (
                <button
                  key={name}
                  type="button"
                  className="flex flex-col items-center gap-0.5 rounded-xl border border-white/12 bg-white/5 px-1 py-2 text-[11px] font-black hover:bg-white/10"
                  onClick={async () => {
                    const res = await shareWallPostToPlatform(lightbox, name);
                    setLightboxHint(
                      res.kind === "downloaded"
                        ? res.hint
                        : res.kind === "opened-fb"
                          ? "Opening Facebook…"
                          : null,
                    );
                  }}
                  aria-label={`Share to ${name}`}
                >
                  <span className="text-lg leading-none">{icon}</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
            {lightboxHint ? (
              <div className="mt-2 rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-[11px] text-white/85">
                {lightboxHint}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
