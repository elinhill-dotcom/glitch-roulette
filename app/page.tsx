import Link from "next/link";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { NeonCard } from "./components/ui/NeonCard";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl py-4 sm:py-8">
      <NeonCard
        className="relative overflow-hidden p-6 sm:p-10"
        glow="orange"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_10%_0%,color-mix(in_oklab,var(--green),transparent_86%),transparent_62%),radial-gradient(900px_420px_at_95%_10%,color-mix(in_oklab,var(--orange),transparent_86%),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Premium sports bar</Badge>
            <Badge tone="orange">Fast ordering</Badge>
            <Badge tone="neutral">Multiplayer game</Badge>
          </div>

          <h1 className="text-balance text-3xl font-black tracking-tight sm:text-5xl">
            Modern sports-bar ordering —
            <span className="text-[color-mix(in_oklab,var(--orange),white_6%)]">
              {" "}
              with a spicy roulette twist.
            </span>
          </h1>
          <p className="text-pretty text-sm leading-7 text-[var(--muted)] sm:text-lg">
            Welcome to <span className="font-extrabold text-white">Flinch Roulette</span>. Tap
            through the menu, build your cart, then jump into the Spicy Challenge for a
            scoreboard-style showdown.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/menu" className="w-full sm:w-auto">
              <Button className="w-full" size="lg">
                Open Menu
              </Button>
            </Link>
            <Link href="/game" className="w-full sm:w-auto">
              <Button className="w-full" size="lg" variant="secondary">
                Enter Spicy Challenge
              </Button>
            </Link>
          </div>

          <div className="mt-2 text-xs text-[var(--muted)]">
            Tip: open the game in multiple tabs to simulate multiplayer instantly.
          </div>
        </div>
      </NeonCard>
    </div>
  );
}
