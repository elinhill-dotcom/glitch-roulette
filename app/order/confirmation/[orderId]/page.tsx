"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { NeonCard } from "../../../components/ui/NeonCard";
import { formatMoney } from "../../../lib/utils";
import { ensureSpicyRoom } from "../../../lib/spicyTelemetry";
import { getOrder } from "../../../state/order";

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const orderId = String(params.orderId ?? "");
  const hostName = search.get("name") ?? "Host";

  const [copied, setCopied] = React.useState(false);
  const order = React.useMemo(() => getOrder(orderId), [orderId]);

  if (!order) {
    return (
      <NeonCard className="p-6" glow="green">
        <div className="text-sm font-black tracking-wide">Order not found</div>
        <div className="mt-1 text-sm text-[var(--muted)]">Please return to the menu and order again.</div>
        <div className="mt-4">
          <Link href="/menu">
            <Button>Back to menu</Button>
          </Link>
        </div>
      </NeonCard>
    );
  }

  const code = order.roomCode;

  return (
    <div className="flex flex-col gap-5">
      <NeonCard className="relative overflow-hidden p-6 sm:p-8" glow="orange">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_320px_at_20%_0%,color-mix(in_oklab,var(--orange),transparent_88%),transparent_62%),radial-gradient(900px_320px_at_90%_0%,color-mix(in_oklab,var(--green),transparent_88%),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="orange">Order confirmed</Badge>
            {order.hasGame ? <Badge tone="green">Game purchased</Badge> : <Badge tone="neutral">No game</Badge>}
          </div>
          <div className="text-2xl font-black tracking-tight sm:text-3xl">Thanks for your order</div>
          <div className="text-sm leading-7 text-[var(--muted)]">
            Your food is being prepared. If you bought <span className="font-black text-white">Not a Flinch</span>,
            your room code is ready.
          </div>
        </div>
      </NeonCard>

      <NeonCard className="p-6" glow="green">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black tracking-wide">Order summary</div>
            <div className="mt-1 text-xs text-[var(--muted)]">{new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-black tracking-widest text-[var(--muted)]">SUBTOTAL</div>
            <div className="text-lg font-black">{formatMoney(order.subtotalCents)}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {order.lines.map((l) => (
            <div key={l.productId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black">{l.name}</div>
                <div className="mt-0.5 text-xs text-[var(--muted)]">
                  {l.qty} × {formatMoney(l.unitPriceCents)}
                </div>
              </div>
              <div className="shrink-0 text-sm font-black">{formatMoney(l.lineTotalCents)}</div>
            </div>
          ))}
        </div>
      </NeonCard>

      {order.hasGame && code ? (
        <NeonCard className="p-6" glow="none">
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm font-black tracking-wide">Not a Flinch — instructions</div>
              <div className="mt-1 text-sm leading-7 text-[var(--muted)]">
                Share the code with your friends. They join via <span className="font-black text-white">Join room</span>.
                When the appetizers arrive at the table, open the game room and start the match.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-black tracking-widest text-[var(--muted)]">ROOM CODE</div>
              <div className="mt-2 font-black tracking-[0.35em] text-3xl text-[color-mix(in_oklab,var(--orange),white_6%)]">
                {code}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? "Copied" : "Copy code"}
                </Button>
                <Button
                  onClick={async () => {
                    // Ensure the room exists in Firestore before sharing the code.
                    await ensureSpicyRoom({ code }).catch(() => {});
                    router.push(`/game/room/${code}?name=${encodeURIComponent(hostName)}&host=1`);
                  }}
                >
                  Open game room
                </Button>
                <Link href={`/game/join`} className="sm:ml-auto">
                  <Button variant="ghost">Where friends join</Button>
                </Link>
              </div>
            </div>
          </div>
        </NeonCard>
      ) : null}
    </div>
  );
}

