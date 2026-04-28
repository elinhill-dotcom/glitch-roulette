"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { NeonCard } from "../../components/ui/NeonCard";
import { Button } from "../../components/ui/Button";

export default function RoomIndexRedirect() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/game/join");
  }, [router]);

  return (
    <NeonCard className="p-6" glow="none">
      <div className="text-sm font-black tracking-wide">Room code missing</div>
      <div className="mt-1 text-sm text-[var(--muted)]">
        You need a 6-character room code to join a room.
      </div>
      <div className="mt-4">
        <Button onClick={() => router.push("/game/join")}>Go to Join room</Button>
      </div>
    </NeonCard>
  );
}

