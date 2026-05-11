import Link from "next/link";
import Image from "next/image";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { NeonCard } from "./components/ui/NeonCard";

export default function Home() {
  return (
    <div className="flex flex-col gap-5">
      <NeonCard className="relative overflow-hidden p-6 sm:p-10" glow="orange">
        <Image
          src="/hero/spicy-arena-fire.jpg"
          alt="Spicy arena background"
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
        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-[1.2fr_0.8fr] sm:items-end">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="orange">Not a Flinch</Badge>
              <Badge tone="green">Multiplayer</Badge>
              <Badge tone="neutral">Scoreboard</Badge>
            </div>
            <div className="text-2xl font-black tracking-tight sm:text-4xl">
              No Flinch <span className="text-white/70">Chili Cheese</span>
            </div>
            <div className="text-sm leading-6 text-white/80">
              <span className="font-black text-[color-mix(in_oklab,var(--orange),white_10%)]">NEW!</span>{" "}
              Boardgame + appetizers in one. 12 one-bite appetizers. 2 are extremely spicy. Eat fast,
              and don&apos;t flinch.
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
              <span>Share the room link with friends to play together.</span>
              <Link
                href="/wall"
                className="font-black text-[color-mix(in_oklab,var(--orange),white_10%)] underline-offset-4 hover:underline"
              >
                🔥 See the Wall of Flinchers →
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/5 shadow-[var(--shadow-soft)]">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/hero/no-flinch-product.png"
                alt="No Flinch product"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
                priority
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.35))]" />
          </div>
        </div>
      </NeonCard>
    </div>
  );
}
