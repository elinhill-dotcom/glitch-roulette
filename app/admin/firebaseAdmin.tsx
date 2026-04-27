"use client";

import * as React from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "../lib/firebase";
import { CATEGORIES, PRODUCTS } from "../lib/menu";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { NeonCard } from "../components/ui/NeonCard";
import { cn, formatMoney } from "../lib/utils";

type DbCategory = {
  id: string;
  label: string;
  tagline: string;
  accent: "green" | "orange";
  order: number;
};

type DbProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  heat: 0 | 1 | 2 | 3 | 4 | 5;
  isAvailable: boolean;
  image?: string | null;
  updatedAt: number;
};
type RoomSnapshot = {
  code: string;
  status: "open" | "finished";
  phase?: string;
  playerCount: number;
  createdAt: number;
  lastActiveAt: number;
};

type SessionSnapshot = {
  roomCode: string;
  startedAt: number;
  endedAt?: number;
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">{label}</div>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-white/12 bg-white/5 px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
    </label>
  );
}

export default function FirebaseAdminPanel() {
  const auth = React.useMemo(() => getFirebaseAuth(), []);
  const db = React.useMemo(() => getDb(), []);

  const [user, setUser] = React.useState<User | null>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [authError, setAuthError] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [cats, setCats] = React.useState<DbCategory[]>([]);
  const [products, setProducts] = React.useState<DbProduct[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [section, setSection] = React.useState<"menu" | "spicy">("menu");
  const [openRooms, setOpenRooms] = React.useState<RoomSnapshot[]>([]);
  const [recentSessions, setRecentSessions] = React.useState<SessionSnapshot[]>([]);
  const [plays, setPlays] = React.useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = React.useState<RoomSnapshot | null>(null);

  const loadMenu = React.useCallback(async () => {
    setBusy("Loading…");
    try {
      const catSnap = await getDocs(
        query(collection(db, "menuCategories"), orderBy("order", "asc")),
      );
      const prodSnap = await getDocs(
        query(collection(db, "menuProducts"), orderBy("name", "asc")),
      );
      setCats(catSnap.docs.map((d) => d.data() as DbCategory));
      setProducts(prodSnap.docs.map((d) => d.data() as DbProduct));
    } finally {
      setBusy(null);
    }
  }, [db]);

  const loadSpicy = React.useCallback(async () => {
    setBusy("Loading…");
    try {
      const roomsSnap = await getDocs(
        query(
          collection(db, "spicyRooms"),
          orderBy("lastActiveAt", "desc"),
          limit(50),
        ),
      );
      const all = roomsSnap.docs.map((d) => d.data() as RoomSnapshot);
      setOpenRooms(all.filter((r) => r.status === "open").slice(0, 25));

      const sessionsSnap = await getDocs(
        query(collection(db, "spicySessions"), orderBy("startedAt", "desc"), limit(25)),
      );
      const sessions = sessionsSnap.docs.map((d) => d.data() as SessionSnapshot);
      setRecentSessions(sessions);
      setPlays(sessions.length);
    } finally {
      setBusy(null);
    }
  }, [db]);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Initial load after login; avoids setState-in-effect lint.
        if (section === "spicy") void loadSpicy();
        else void loadMenu();
      }
    });
    return () => unsub();
  }, [auth, loadMenu, loadSpicy, section]);

  async function seedFromLocal() {
    setBusy("Seeding…");
    try {
      await Promise.all(
        CATEGORIES.map((c, i) =>
          setDoc(doc(db, "menuCategories", c.id), { ...c, order: i } satisfies DbCategory, {
            merge: true,
          }),
        ),
      );
      await Promise.all(
        PRODUCTS.map((p) =>
          setDoc(
            doc(db, "menuProducts", p.id),
            { ...p, updatedAt: Date.now() } satisfies DbProduct,
            { merge: true },
          ),
        ),
      );
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function setImageUrl(productId: string, url: string) {
    setBusy("Saving…");
    try {
      await updateDoc(doc(db, "menuProducts", productId), {
        image: url.trim() || null,
        updatedAt: Date.now(),
      });
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function updateCategory(catId: string, patch: Partial<DbCategory>) {
    setBusy("Saving…");
    try {
      await updateDoc(doc(db, "menuCategories", catId), patch);
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function addCategory() {
    setBusy("Creating…");
    try {
      const order = (cats.at(-1)?.order ?? -1) + 1;
      const id = `cat_${Math.random().toString(16).slice(2, 8)}`;
      const next: DbCategory = { id, label: "New category", tagline: "", accent: "green", order };
      await setDoc(doc(db, "menuCategories", id), next, { merge: true });
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function deleteCategory(catId: string) {
    setBusy("Deleting…");
    try {
      await deleteDoc(doc(db, "menuCategories", catId));
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function moveCategory(catId: string, dir: -1 | 1) {
    const idx = cats.findIndex((c) => c.id === catId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= cats.length) return;
    const a = cats[idx]!;
    const b = cats[swapIdx]!;
    setBusy("Reordering…");
    try {
      await Promise.all([
        updateDoc(doc(db, "menuCategories", a.id), { order: b.order }),
        updateDoc(doc(db, "menuCategories", b.id), { order: a.order }),
      ]);
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function updateProduct(productId: string, patch: Partial<DbProduct>) {
    setBusy("Saving…");
    try {
      await updateDoc(doc(db, "menuProducts", productId), { ...patch, updatedAt: Date.now() });
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function addProduct() {
    setBusy("Creating…");
    try {
      const id = `p_${Math.random().toString(16).slice(2, 9)}`;
      const firstCat = cats[0]?.id ?? "wings";
      const p: DbProduct = {
        id,
        categoryId: firstCat,
        name: "New product",
        description: "",
        priceCents: 0,
        heat: 0,
        isAvailable: false,
        image: "",
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, "menuProducts", id), p, { merge: true });
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function deleteProduct(productId: string) {
    setBusy("Deleting…");
    try {
      await deleteDoc(doc(db, "menuProducts", productId));
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function toggleAvail(productId: string, next: boolean) {
    setBusy("Saving…");
    try {
      await updateDoc(doc(db, "menuProducts", productId), {
        isAvailable: next,
        updatedAt: Date.now(),
      });
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  async function setPrice(productId: string, euros: number) {
    setBusy("Saving…");
    try {
      await updateDoc(doc(db, "menuProducts", productId), {
        priceCents: Math.max(0, Math.round(euros * 100)),
        updatedAt: Date.now(),
      });
      await loadMenu();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <NeonCard className="p-6" glow="none">
        <div className="text-sm font-black">Loading…</div>
      </NeonCard>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-5">
        <NeonCard className="p-6" glow="none">
          <div className="text-sm font-black tracking-wide">Admin login</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            Sign in with a Firebase Auth admin user.
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="EMAIL" value={email} onChange={setEmail} placeholder="admin@domain.com" />
            <TextField
              label="PASSWORD"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
            />
          </div>
          {authError ? (
            <div className="mt-3 rounded-xl border border-[color-mix(in_oklab,var(--red),transparent_35%)] bg-[color-mix(in_oklab,var(--red),transparent_90%)] px-3 py-2 text-sm">
              {authError}
            </div>
          ) : null}
          <div className="mt-4">
            <Button
              size="lg"
              onClick={async () => {
                setAuthError(null);
                try {
                  await signInWithEmailAndPassword(auth, email, password);
                } catch (e) {
                  setAuthError(e instanceof Error ? e.message : "Login failed");
                }
              }}
            >
              Sign in
            </Button>
          </div>
        </NeonCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <NeonCard className="p-6" glow="none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-black tracking-wide">Firebase Admin</div>
            <div className="mt-1 text-xs text-[var(--muted)] truncate">
              Signed in as {user.email ?? user.uid}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={section === "menu" ? "secondary" : "ghost"}
              onClick={() => {
                setSelectedRoom(null);
                setSection("menu");
                void loadMenu();
              }}
            >
              Menu
            </Button>
            <Button
              variant={section === "spicy" ? "secondary" : "ghost"}
              onClick={() => {
                setSelectedRoom(null);
                setSection("spicy");
                void loadSpicy();
              }}
            >
              Spicy Challenge
            </Button>
            <Button
              variant="secondary"
              onClick={() => (section === "menu" ? loadMenu() : loadSpicy())}
              disabled={!!busy}
            >
              Refresh
            </Button>
            {section === "menu" ? (
              <Button variant="secondary" onClick={seedFromLocal} disabled={!!busy}>
                Seed menu
              </Button>
            ) : null}
            <Button variant="ghost" onClick={async () => signOut(auth)}>
              Sign out
            </Button>
          </div>
        </div>
        {busy ? <div className="mt-3 text-xs text-[var(--muted)]">{busy}</div> : null}
      </NeonCard>

      {section === "menu" ? (
        <>
          <NeonCard className="p-6" glow="none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black tracking-wide">Menu categories</div>
                <div className="mt-1 text-xs text-[var(--muted)]">Create, edit, reorder.</div>
              </div>
              <Button variant="secondary" onClick={addCategory} disabled={!!busy}>
                Add category
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {cats.map((c, i) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="flex flex-col gap-2">
                          <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                            LABEL
                          </div>
                          <input
                            key={`label:${c.id}:${c.label}`}
                            defaultValue={c.label}
                            onBlur={(e) => void updateCategory(c.id, { label: e.currentTarget.value })}
                            className="h-11 rounded-xl border border-white/12 bg-white/5 px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                            TAGLINE
                          </div>
                          <input
                            key={`tagline:${c.id}:${c.tagline}`}
                            defaultValue={c.tagline}
                            onBlur={(e) => void updateCategory(c.id, { tagline: e.currentTarget.value })}
                            className="h-11 rounded-xl border border-white/12 bg-white/5 px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                            ACCENT
                          </div>
                          <select
                            value={c.accent}
                            onChange={(e) =>
                              void updateCategory(c.id, { accent: e.target.value as "green" | "orange" })
                            }
                            className="h-11 rounded-xl border border-white/12 bg-white/5 px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                          >
                            <option value="green">green</option>
                            <option value="orange">orange</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge tone="neutral">#{i + 1}</Badge>
                      <Button variant="ghost" onClick={() => moveCategory(c.id, -1)} disabled={!!busy}>
                        ↑
                      </Button>
                      <Button variant="ghost" onClick={() => moveCategory(c.id, 1)} disabled={!!busy}>
                        ↓
                      </Button>
                      <Button variant="danger" onClick={() => deleteCategory(c.id)} disabled={!!busy}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>

          <NeonCard className="p-6" glow="none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black tracking-wide">Menu products</div>
                <div className="mt-1 text-xs text-[var(--muted)]">Full product editor.</div>
              </div>
              <Button variant="secondary" onClick={addProduct} disabled={!!busy}>
                Add product
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-2">
                          <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                            NAME
                          </div>
                          <input
                            key={`name:${p.id}:${p.name}`}
                            defaultValue={p.name}
                            onBlur={(e) => void updateProduct(p.id, { name: e.currentTarget.value })}
                            className="h-11 rounded-xl border border-white/12 bg-white/5 px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                            CATEGORY
                          </div>
                          <select
                            value={p.categoryId}
                            onChange={(e) =>
                              void updateProduct(p.id, { categoryId: e.target.value })
                            }
                            className="h-11 rounded-xl border border-white/12 bg-white/5 px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                          >
                            {cats.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2 sm:col-span-2">
                          <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                            DESCRIPTION
                          </div>
                          <textarea
                            key={`desc:${p.id}:${p.description}`}
                            defaultValue={p.description}
                            onBlur={(e) =>
                              void updateProduct(p.id, { description: e.currentTarget.value })
                            }
                            className="min-h-20 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                          />
                        </label>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className={cn(
                            "rounded-xl border px-3 py-2 text-xs font-black tracking-widest transition",
                            p.isAvailable
                              ? "border-[color-mix(in_oklab,var(--green),transparent_55%)] bg-[color-mix(in_oklab,var(--green),transparent_90%)]"
                              : "border-[color-mix(in_oklab,var(--red),transparent_55%)] bg-[color-mix(in_oklab,var(--red),transparent_90%)]",
                          )}
                          onClick={() => toggleAvail(p.id, !p.isAvailable)}
                          disabled={!!busy}
                        >
                          {p.isAvailable ? "LIVE" : "PAUSE"}
                        </button>

                        <label className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black">
                          <span className="text-[var(--muted)]">€</span>
                          <input
                            defaultValue={String((p.priceCents / 100).toFixed(2))}
                            onBlur={(e) => {
                              const v = Number(e.currentTarget.value.replace(",", "."));
                              if (!Number.isFinite(v)) return;
                              void setPrice(p.id, v);
                            }}
                            inputMode="decimal"
                            className="w-20 bg-transparent text-right outline-none"
                            disabled={!!busy}
                          />
                        </label>

                        <label className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black">
                          <span className="text-[var(--muted)]">HEAT</span>
                          <input
                            defaultValue={String(p.heat)}
                            onBlur={(e) => {
                              const v = Number(e.currentTarget.value.replace(/[^\d]/g, "") || "0");
                              const clamped = Math.max(0, Math.min(5, Math.round(v))) as 0 | 1 | 2 | 3 | 4 | 5;
                              void updateProduct(p.id, { heat: clamped });
                            }}
                            inputMode="numeric"
                            className="w-12 bg-transparent text-right outline-none"
                            disabled={!!busy}
                          />
                        </label>

                        <label className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-black">
                          <span className="text-[var(--muted)]">IMG</span>
                          <input
                            defaultValue={typeof p.image === "string" ? p.image : ""}
                            onBlur={(e) => void setImageUrl(p.id, e.currentTarget.value)}
                            placeholder="https://…"
                            className="w-72 bg-transparent text-xs font-semibold outline-none"
                            disabled={!!busy}
                          />
                        </label>

                        <Button variant="danger" onClick={() => deleteProduct(p.id)} disabled={!!busy}>
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="shrink-0 text-sm font-black">{formatMoney(p.priceCents)}</div>
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>
        </>
      ) : (
        <>
          <NeonCard className="p-6" glow="none">
            <div className="text-sm font-black tracking-wide">Spicy Challenge</div>
            <div className="mt-1 text-xs text-[var(--muted)]">Live rooms + recent plays.</div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                  PLAYS (LAST 25)
                </div>
                <div className="mt-2 text-2xl font-black">{plays ?? "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <div className="text-[11px] font-black tracking-widest text-[var(--muted)]">
                  OPEN ROOMS
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {openRooms.length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">No open rooms tracked yet.</div>
                  ) : (
                    openRooms.map((r) => (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => setSelectedRoom(r)}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
                          selectedRoom?.code === r.code
                            ? "border-white/18 bg-white/10"
                            : "border-white/10 bg-white/5 hover:bg-white/8",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-black">Room {r.code}</div>
                          <div className="mt-1 text-xs text-[var(--muted)]">
                            {r.playerCount} players • phase {r.phase ?? "—"}
                          </div>
                        </div>
                        <Badge tone="orange">OPEN</Badge>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </NeonCard>

          <NeonCard className="p-6" glow="none">
            <div className="text-sm font-black tracking-wide">Recent sessions</div>
            <div className="mt-3 flex flex-col gap-2">
              {recentSessions.length === 0 ? (
                <div className="text-sm text-[var(--muted)]">No sessions tracked yet.</div>
              ) : (
                recentSessions.map((s, idx) => (
                  <div
                    key={`${s.roomCode}-${s.startedAt}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black">Room {s.roomCode}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        started {new Date(s.startedAt).toLocaleString("en-GB")}
                        {s.endedAt ? ` • ended ${new Date(s.endedAt).toLocaleString("en-GB")}` : ""}
                      </div>
                    </div>
                    <Badge tone={s.endedAt ? "neutral" : "orange"}>{s.endedAt ? "DONE" : "LIVE"}</Badge>
                  </div>
                ))
              )}
            </div>
          </NeonCard>
        </>
      )}
    </div>
  );
}

