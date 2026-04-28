import Link from "next/link";
import Image from "next/image";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { NeonCard } from "../components/ui/NeonCard";

export default function GameIntroPage() {
  return (
    <div className="flex flex-col gap-5">
      <NeonCard className="relative overflow-hidden p-6 sm:p-10" glow="orange">
        <Image
          src="/hero/no-flinch-product.png"
          alt="No Flinch game box"
          fill
          priority
          className="pointer-events-none object-cover"
          sizes="(max-width: 768px) 100vw, 900px"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45),rgba(0,0,0,0.82))]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-1"
          style={{
            background:
              "linear-gradient(90deg,var(--green),var(--orange),var(--red),var(--yellow))",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="orange">Spicy Challenge</Badge>
            <Badge tone="green">Multiplayer</Badge>
            <Badge tone="neutral">Scoreboard</Badge>
          </div>
          <div className="text-2xl font-black tracking-tight sm:text-4xl">
            No Flinch <span className="text-white/70">Chili Cheese</span>
          </div>
          <div className="text-sm leading-6 text-[var(--muted)]">
            12 one-bite appetizers. 2 are extremely spicy. Guess first, eat fast, and don't flinch.
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/game/create" className="w-full sm:w-auto">
              <Button className="w-full" size="lg">
                Create room
              </Button>
            </Link>
            <Link href="/game/join" className="w-full sm:w-auto">
              <Button className="w-full" size="lg" variant="secondary">
                Join room
              </Button>
            </Link>
          </div>
          <div className="text-xs text-[var(--muted)]">
            Share a room code to play together.
          </div>
        </div>
      </NeonCard>
    </div>
  );
}

