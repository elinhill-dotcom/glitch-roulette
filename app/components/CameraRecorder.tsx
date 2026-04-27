"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { NeonCard } from "./ui/NeonCard";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function CameraRecorder({ open, onOpenChange }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const [status, setStatus] = React.useState<"idle" | "ready" | "recording" | "done" | "error">(
    "idle",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    chunksRef.current = [];

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("ready");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Could not access camera";
        setError(msg);
        setStatus("error");
      }
    })();

    return () => {
      try {
        recRef.current?.stop();
      } catch {
        // ignore
      }
      recRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [open, blobUrl]);

  const start = React.useCallback(() => {
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
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setStatus("done");
      };
      rec.start();
      setStatus("recording");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Recording failed";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const stop = React.useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  const share = React.useCallback(async () => {
    if (!blobUrl) return;
    const res = await fetch(blobUrl);
    const blob = await res.blob();
    const file = new File([blob], "glitch-roulette.webm", { type: "video/webm" });

    // Web Share API (best-effort)
    if ("share" in navigator) {
      const canShare = "canShare" in navigator ? navigator.canShare?.({ files: [file] }) : false;
      if (canShare) {
        await navigator.share({ files: [file], title: "Flinch Roulette", text: "Not a Flinch" });
        return;
      }
    }
    // fallback: download
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "glitch-roulette.webm";
    a.click();
  }, [blobUrl]);

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
            <div className="text-sm font-black tracking-wide">Record (with filter)</div>
            <button
              type="button"
              className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </div>

          {status === "error" ? (
            <div className="mt-3 text-sm text-[color-mix(in_oklab,var(--red),white_10%)]">{error}</div>
          ) : null}

          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className={cn(
                "h-72 w-full object-cover",
                // “filter” vibe: contrast + warmth + slight hue
                "contrast-125 saturate-150 hue-rotate-[-6deg]",
              )}
            />
          </div>

          {blobUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video src={blobUrl} controls className="h-40 w-full object-cover" />
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            {status === "ready" ? (
              <Button className="w-full" onClick={start}>
                Start recording
              </Button>
            ) : null}
            {status === "recording" ? (
              <Button className="w-full" variant="danger" onClick={stop}>
                Stop
              </Button>
            ) : null}
            {status === "done" ? (
              <>
                <Button className="w-full" variant="secondary" onClick={start}>
                  Record again
                </Button>
                <Button className="w-full" onClick={share}>
                  Share / Download
                </Button>
              </>
            ) : null}
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">
            Tip: If Share isn’t available, it will download the video.
          </div>
        </NeonCard>
      </div>
    </div>
  );
}

