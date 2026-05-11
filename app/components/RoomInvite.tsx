"use client";

import * as React from "react";
import { Button } from "./ui/Button";

export function RoomInvite({
  code,
  hostName,
  size = "md",
  className,
}: {
  code: string;
  hostName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [canShare, setCanShare] = React.useState(false);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const joinUrl = origin ? `${origin}/game/join?code=${encodeURIComponent(code)}` : "";
  const shareTitle = "Not a Flinch — join my room";
  const shareText = hostName
    ? `${hostName} invited you to Not a Flinch. Room code: ${code}.`
    : `Join my Not a Flinch room. Room code: ${code}.`;

  const onClick = async () => {
    const url = joinUrl || code;
    if (canShare) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${url}`.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", `${shareText} ${url}`.trim());
    }
  };

  const label = copied ? "Link copied" : "Copy link";

  return (
    <div className={className}>
      <Button
        size={size}
        onClick={onClick}
        className="w-full"
        aria-label="Copy invite link and share with your friends"
      >
        {label}
      </Button>
      <div className="mt-1.5 text-center text-[11px] text-[var(--muted)]">
        Share with your friends
      </div>
    </div>
  );
}
