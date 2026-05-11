"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "../lib/utils";
import { uploadFlinchPhoto } from "../lib/wall";
import { Button } from "./ui/Button";
import { NeonCard } from "./ui/NeonCard";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Used for attribution on the Wall of Flinchers. */
  playerName?: string;
  /** Optional room code to tag the post with. */
  roomCode?: string | null;
};

const VIDEO_FILTER_CSS = "contrast(1.25) saturate(1.5) hue-rotate(-6deg)";

const OVERLAY_KICKER = "FLINCHED AT";
const OVERLAY_TITLE = "🔥 SALUD! 🔥";
const OVERLAY_TAGLINE = "Do you dare? This one did.";

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function flamePath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  height: number,
  width: number,
) {
  const halfW = width / 2;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, baseY);
  ctx.bezierCurveTo(
    cx - halfW,
    baseY - height * 0.55,
    cx - halfW * 0.25,
    baseY - height * 0.45,
    cx,
    baseY - height,
  );
  ctx.bezierCurveTo(
    cx + halfW * 0.25,
    baseY - height * 0.45,
    cx + halfW,
    baseY - height * 0.55,
    cx + halfW,
    baseY,
  );
  ctx.closePath();
}

function drawFlame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  height: number,
  width: number,
) {
  // Outer red plume (slightly larger, soft).
  let g = ctx.createLinearGradient(cx, baseY, cx, baseY - height);
  g.addColorStop(0, "rgba(229,57,53,0.95)");
  g.addColorStop(0.55, "rgba(229,57,53,0.55)");
  g.addColorStop(1, "rgba(229,57,53,0)");
  ctx.fillStyle = g;
  flamePath(ctx, cx, baseY, height, width);
  ctx.fill();

  // Middle orange layer.
  g = ctx.createLinearGradient(cx, baseY, cx, baseY - height * 0.85);
  g.addColorStop(0, "rgba(247,148,29,0.95)");
  g.addColorStop(1, "rgba(247,148,29,0)");
  ctx.fillStyle = g;
  flamePath(ctx, cx, baseY, height * 0.85, width * 0.7);
  ctx.fill();

  // Inner yellow core.
  g = ctx.createLinearGradient(cx, baseY, cx, baseY - height * 0.6);
  g.addColorStop(0, "rgba(255,225,140,1)");
  g.addColorStop(1, "rgba(255,213,79,0)");
  ctx.fillStyle = g;
  flamePath(ctx, cx, baseY, height * 0.6, width * 0.45);
  ctx.fill();
}

function FlamesSVG() {
  // Same flame geometry as the canvas version (3 stacked layers: red, orange, yellow).
  // The viewBox is unitless and we let the parent stretch it to whatever size.
  const flames = [12, 32, 52, 72, 92, 112, 132, 152, 172, 192];
  const baseY = 72;
  return (
    <svg
      viewBox="0 0 200 72"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flame-red" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#e53935" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#e53935" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e53935" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flame-orange" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f7941d" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f7941d" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flame-yellow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffe18c" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffd54f" stopOpacity="0" />
        </linearGradient>
        <filter id="flame-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      {flames.map((cx, i) => {
        const hJitter = 0.65 + ((i * 37) % 100) / 280;
        const wJitter = 0.75 + ((i * 23) % 100) / 320;
        const h = 62 * hJitter;
        const w = 26 * wJitter;
        const halfW = w / 2;
        const tipY = baseY - h;
        // Three layered teardrop paths (red, orange, yellow).
        const outerPath = `M ${cx - halfW} ${baseY} C ${cx - halfW} ${baseY - h * 0.55} ${cx - halfW * 0.25} ${baseY - h * 0.45} ${cx} ${tipY} C ${cx + halfW * 0.25} ${baseY - h * 0.45} ${cx + halfW} ${baseY - h * 0.55} ${cx + halfW} ${baseY} Z`;
        const midPath = `M ${cx - w * 0.35} ${baseY} C ${cx - w * 0.35} ${baseY - h * 0.47} ${cx - w * 0.1} ${baseY - h * 0.38} ${cx} ${baseY - h * 0.85} C ${cx + w * 0.1} ${baseY - h * 0.38} ${cx + w * 0.35} ${baseY - h * 0.47} ${cx + w * 0.35} ${baseY} Z`;
        const innerPath = `M ${cx - w * 0.22} ${baseY} C ${cx - w * 0.22} ${baseY - h * 0.34} ${cx - w * 0.05} ${baseY - h * 0.27} ${cx} ${baseY - h * 0.6} C ${cx + w * 0.05} ${baseY - h * 0.27} ${cx + w * 0.22} ${baseY - h * 0.34} ${cx + w * 0.22} ${baseY} Z`;
        const duration = (1.3 + (i % 4) * 0.18).toFixed(2);
        const delay = ((i * 0.13) % 1.2).toFixed(2);
        return (
          <g
            key={cx}
            style={{
              transformOrigin: `${cx}px ${baseY}px`,
              animation: `nfFlicker${i % 3} ${duration}s ease-in-out ${delay}s infinite`,
            }}
          >
            <path d={outerPath} fill="url(#flame-red)" filter="url(#flame-blur)" />
            <path d={midPath} fill="url(#flame-orange)" />
            <path d={innerPath} fill="url(#flame-yellow)" />
          </g>
        );
      })}
      {/* Embers */}
      {Array.from({ length: 14 }).map((_, i) => {
        const ex = 8 + ((i * 73) % 184);
        const ey = 6 + ((i * 41) % 24);
        const r = 0.9 + ((i * 11) % 4) * 0.3;
        const delay = ((i * 0.21) % 1.6).toFixed(2);
        return (
          <circle
            key={i}
            cx={ex}
            cy={ey}
            r={r}
            fill="#ffd54f"
            opacity="0.85"
            style={{
              animation: `nfEmber ${(1.6 + (i % 3) * 0.25).toFixed(2)}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes nfFlicker0 { 0%,100% { transform: scaleY(0.94) scaleX(1.02); opacity: 0.88; } 50% { transform: scaleY(1.08) scaleX(0.97); opacity: 1; } }
        @keyframes nfFlicker1 { 0%,100% { transform: scaleY(1.04) scaleX(0.98); opacity: 0.92; } 50% { transform: scaleY(0.92) scaleX(1.04); opacity: 1; } }
        @keyframes nfFlicker2 { 0%,100% { transform: scaleY(0.97) scaleX(1.01); opacity: 0.85; } 50% { transform: scaleY(1.12) scaleX(0.95); opacity: 1; } }
        @keyframes nfEmber { 0% { transform: translateY(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(-12px); opacity: 0; } }
      `}</style>
    </svg>
  );
}

function drawEmbers(
  ctx: CanvasRenderingContext2D,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  count: number,
) {
  // Deterministic pseudo-random scatter so a single capture looks natural
  // without depending on Math.random (keeps the result stable per frame).
  for (let i = 0; i < count; i++) {
    const ex = areaX + ((i * 73) % 100) * (areaW / 100);
    const ey = areaY + ((i * 41) % 100) * (areaH / 100);
    const r = 1.5 + ((i * 11) % 5);
    const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * 3.5);
    grad.addColorStop(0, "rgba(255,235,150,0.95)");
    grad.addColorStop(0.5, "rgba(247,148,29,0.6)");
    grad.addColorStop(1, "rgba(229,57,53,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ex, ey, r * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlinchOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  logo: HTMLImageElement | null,
) {
  const pad = Math.round(W * 0.04);
  const bannerH = Math.round(H * 0.22);
  const bannerY = H - bannerH - pad;
  const bannerW = W - 2 * pad;
  const bannerX = pad;
  const radius = Math.round(W * 0.03);

  ctx.save();

  // 1) BANNER background first so flames are drawn on top of its top edge.
  const grad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0.88)");
  roundRectPath(ctx, bannerX, bannerY, bannerW, bannerH, radius);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(2, Math.round(W * 0.003));
  ctx.strokeStyle = "rgba(255,170,60,0.45)";
  ctx.stroke();

  // 2) FLAMES erupting upward from the banner's top edge.
  // Use "screen"-style additive blending so flames glow against the photo.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const flameCount = Math.max(6, Math.round(bannerW / Math.max(40, W * 0.07)));
  const flameMaxH = Math.round(bannerH * 0.85);
  for (let i = 0; i < flameCount; i++) {
    const t = (i + 0.5) / flameCount;
    const fx = bannerX + bannerW * t;
    // Deterministic variation: each flame gets a unique height + width.
    const hJitter = 0.65 + ((i * 37) % 100) / 280; // 0.65 – 1.0
    const wJitter = 0.75 + ((i * 23) % 100) / 320; // 0.75 – 1.08
    const h = flameMaxH * hJitter;
    const w = (bannerW / flameCount) * 1.4 * wJitter;
    drawFlame(ctx, fx, bannerY + Math.round(bannerH * 0.04), h, w);
  }
  // Sparks / embers floating above the flames.
  drawEmbers(
    ctx,
    bannerX,
    bannerY - flameMaxH - Math.round(bannerH * 0.3),
    bannerW,
    flameMaxH + Math.round(bannerH * 0.3),
    Math.max(10, Math.round(bannerW / 60)),
  );
  ctx.restore();

  // 3) Big flame sticker in the top-left corner of the photo.
  const stickerSize = Math.round(W * 0.16);
  ctx.font = `${stickerSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = Math.round(stickerSize * 0.12);
  ctx.shadowOffsetY = Math.round(stickerSize * 0.05);
  ctx.fillText("🔥", pad, pad);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const logoSize = Math.round(bannerH * 0.72);
  const logoX = bannerX + Math.round(bannerH * 0.18);
  const logoY = bannerY + Math.round((bannerH - logoSize) / 2);
  roundRectPath(ctx, logoX, logoY, logoSize, logoSize, Math.round(logoSize * 0.2));
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  if (logo && logo.complete && logo.naturalWidth > 0) {
    const inset = Math.round(logoSize * 0.12);
    ctx.save();
    roundRectPath(
      ctx,
      logoX + inset,
      logoY + inset,
      logoSize - 2 * inset,
      logoSize - 2 * inset,
      Math.round(logoSize * 0.16),
    );
    ctx.clip();
    ctx.drawImage(
      logo,
      logoX + inset,
      logoY + inset,
      logoSize - 2 * inset,
      logoSize - 2 * inset,
    );
    ctx.restore();
  }

  const fontStack = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  const textX = logoX + logoSize + Math.round(bannerH * 0.18);
  const textTop = bannerY + Math.round(bannerH * 0.16);

  ctx.textBaseline = "top";

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `900 ${Math.round(bannerH * 0.14)}px ${fontStack}`;
  ctx.fillText(OVERLAY_KICKER, textX, textTop);

  // Brand orange (matches --orange in globals.css) for the main hit.
  const titleY = textTop + Math.round(bannerH * 0.18);
  ctx.font = `900 ${Math.round(bannerH * 0.44)}px ${fontStack}`;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = Math.max(2, Math.round(bannerH * 0.02));
  ctx.shadowOffsetY = Math.max(1, Math.round(bannerH * 0.01));
  ctx.fillStyle = "#f7941d";
  ctx.fillText(OVERLAY_TITLE, textX, titleY);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = `600 ${Math.round(bannerH * 0.13)}px ${fontStack}`;
  ctx.fillText(OVERLAY_TAGLINE, textX, textTop + Math.round(bannerH * 0.66));

  ctx.restore();
}

export function CameraRecorder({ open, onOpenChange, playerName, roomCode }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const logoRef = React.useRef<HTMLImageElement | null>(null);

  const [status, setStatus] = React.useState<
    "idle" | "ready" | "recording" | "video-done" | "photo-done" | "error"
  >("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [facing, setFacing] = React.useState<"user" | "environment">("user");
  const [wallStatus, setWallStatus] = React.useState<"idle" | "posting" | "posted" | "error">(
    "idle",
  );
  const [wallError, setWallError] = React.useState<string | null>(null);

  // Preload the logo so the baked-in overlay shows it on the first photo.
  React.useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = "/logo.png";
    img.onload = () => {
      logoRef.current = img;
    };
  }, []);

  // Cleanup any blob URLs when the modal closes or new captures replace them.
  React.useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [videoUrl, photoUrl]);

  React.useEffect(() => {
    if (!open) {
      setStatus("idle");
      setVideoUrl(null);
      setPhotoUrl(null);
      setError(null);
      setWallStatus("idle");
      setWallError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus("ready");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Could not access camera";
        setError(msg);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      try {
        recRef.current?.stop();
      } catch {
        // ignore
      }
      recRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing]);

  const takePhoto = React.useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Apply the same "filter" vibe so the file matches the on-screen preview.
    ctx.filter = VIDEO_FILTER_CSS;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    // Bake the branded overlay into the photo so it can be shared as-is.
    drawFlinchOverlay(ctx, canvas.width, canvas.height, logoRef.current);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
        setStatus("photo-done");
        setWallStatus("idle");
        setWallError(null);
      },
      "image/jpeg",
      0.92,
    );
  }, [photoUrl]);

  const postPhotoToWall = React.useCallback(async () => {
    if (!photoUrl) return;
    setWallStatus("posting");
    setWallError(null);
    try {
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      await uploadFlinchPhoto({
        blob,
        playerName: playerName ?? "Anonymous",
        roomCode: roomCode ?? null,
      });
      setWallStatus("posted");
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Could not post to the wall. Check your connection and try again.";
      setWallError(msg);
      setWallStatus("error");
    }
  }, [photoUrl, playerName, roomCode]);

  const startVideo = React.useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setStatus("video-done");
      };
      rec.start();
      setStatus("recording");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Recording failed";
      setError(msg);
      setStatus("error");
    }
  }, [videoUrl]);

  const stopVideo = React.useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  const sharePhoto = React.useCallback(async () => {
    if (!photoUrl) return;
    const res = await fetch(photoUrl);
    const blob = await res.blob();
    const file = new File([blob], "not-a-flinch.jpg", { type: "image/jpeg" });
    if ("share" in navigator) {
      const canShare =
        "canShare" in navigator ? navigator.canShare?.({ files: [file] }) : false;
      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: "Not a Flinch",
            text: "Caught a moment in Not a Flinch.",
          });
          return;
        } catch {
          // user cancelled
        }
      }
    }
    const a = document.createElement("a");
    a.href = photoUrl;
    a.download = "not-a-flinch.jpg";
    a.click();
  }, [photoUrl]);

  const shareVideo = React.useCallback(async () => {
    if (!videoUrl) return;
    const res = await fetch(videoUrl);
    const blob = await res.blob();
    const file = new File([blob], "not-a-flinch.webm", { type: "video/webm" });
    if ("share" in navigator) {
      const canShare =
        "canShare" in navigator ? navigator.canShare?.({ files: [file] }) : false;
      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: "Not a Flinch",
            text: "Caught a moment in Not a Flinch.",
          });
          return;
        } catch {
          // user cancelled
        }
      }
    }
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "not-a-flinch.webm";
    a.click();
  }, [videoUrl]);

  const flip = () => setFacing((f) => (f === "user" ? "environment" : "user"));

  const reset = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setPhotoUrl(null);
    setVideoUrl(null);
    setStatus("ready");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md p-4">
        <NeonCard className="overflow-hidden p-4" glow="none">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-black tracking-wide">Capture & share</div>
              <div className="text-[11px] text-[var(--muted)]">
                Take a quick photo or short video, then share to your stories.
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black hover:bg-white/10"
              onClick={() => onOpenChange(false)}
              aria-label="Close camera"
            >
              Close
            </button>
          </div>

          {status === "error" ? (
            <div className="mt-3 text-sm text-[color-mix(in_oklab,var(--red),white_10%)]">
              {error}
            </div>
          ) : null}

          {/* PHOTO PREVIEW takes precedence over the live feed */}
          {status === "photo-done" && photoUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Captured" className="h-72 w-full object-cover" />
            </div>
          ) : status === "video-done" && videoUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video src={videoUrl} controls className="h-72 w-full object-cover" />
            </div>
          ) : (
            <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className={cn(
                  "h-72 w-full object-cover",
                  "contrast-125 saturate-150 hue-rotate-[-6deg]",
                )}
              />
              {/* Live preview of the "Flinched at Salud!" filter that gets baked into photos */}
              <div className="pointer-events-none absolute left-2 top-2 text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                🔥
              </div>
              <div className="pointer-events-none absolute inset-x-2 bottom-2">
                {/* Flames erupting from the top of the banner. Negative margin
                    pulls them down so their base merges with the banner edge. */}
                <div
                  className="relative mix-blend-screen"
                  style={{ height: "68px", marginBottom: "-10px" }}
                >
                  <FlamesSVG />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[color-mix(in_oklab,var(--orange),transparent_55%)] bg-black/65 px-3 py-2 backdrop-blur-sm">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-white/12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo.png"
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <div className="text-[9px] font-black tracking-[0.18em] text-white/70">
                      {OVERLAY_KICKER}
                    </div>
                    <div className="text-xl font-black tracking-tight text-[color-mix(in_oklab,var(--orange),white_8%)] drop-shadow">
                      {OVERLAY_TITLE}
                    </div>
                    <div className="text-[10px] font-semibold text-white/85">
                      {OVERLAY_TAGLINE}
                    </div>
                  </div>
                </div>
              </div>
              {status === "recording" ? (
                <div className="absolute right-2 top-2 inline-flex items-center gap-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black tracking-widest text-[color-mix(in_oklab,var(--red),white_10%)]">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[color-mix(in_oklab,var(--red),white_10%)]" />
                  REC
                </div>
              ) : null}
              {status === "ready" ? (
                <button
                  type="button"
                  onClick={flip}
                  className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[10px] font-black tracking-widest text-white hover:bg-black/75"
                  aria-label="Switch camera"
                >
                  Flip
                </button>
              ) : null}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {status === "ready" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={takePhoto} size="lg">
                  📸 Take photo
                </Button>
                <Button onClick={startVideo} size="lg" variant="secondary">
                  ⏺ Record video
                </Button>
              </div>
            ) : null}

            {status === "recording" ? (
              <Button onClick={stopVideo} size="lg" variant="danger">
                ⏹ Stop recording
              </Button>
            ) : null}

            {status === "photo-done" ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={sharePhoto} size="lg">
                    Share photo
                  </Button>
                  <Button onClick={reset} size="lg" variant="secondary">
                    Retake
                  </Button>
                </div>
                {wallStatus === "posted" ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[color-mix(in_oklab,var(--green),transparent_50%)] bg-[color-mix(in_oklab,var(--green),transparent_88%)] px-3 py-2 text-xs font-black">
                    <span className="truncate">Posted to the wall.</span>
                    <Link
                      href="/wall"
                      className="rounded-lg border border-white/15 bg-white/8 px-2 py-1 text-[11px] font-black hover:bg-white/12"
                    >
                      View wall →
                    </Link>
                  </div>
                ) : (
                  <Button
                    onClick={postPhotoToWall}
                    size="lg"
                    variant="secondary"
                    disabled={wallStatus === "posting"}
                  >
                    {wallStatus === "posting"
                      ? "Posting…"
                      : "📌 Post to Wall of Flinchers"}
                  </Button>
                )}
                {wallStatus === "error" && wallError ? (
                  <div className="text-[11px] text-[color-mix(in_oklab,var(--red),white_10%)]">
                    {wallError}
                  </div>
                ) : null}
              </div>
            ) : null}

            {status === "video-done" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={shareVideo} size="lg">
                  Share video
                </Button>
                <Button onClick={reset} size="lg" variant="secondary">
                  Record again
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-2 text-[11px] text-[var(--muted)]">
            On mobile this opens your share sheet (Instagram, Snapchat, SMS, Messenger, …). On
            desktop the file downloads instead.
          </div>
        </NeonCard>
      </div>
    </div>
  );
}
