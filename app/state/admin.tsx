"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ProductOverride = {
  priceCents?: number;
  isAvailable?: boolean;
};

type AdminState = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
  overrides: Record<string, ProductOverride>;
  setOverride: (productId: string, next: ProductOverride) => void;
  clearOverrides: () => void;
};

const AdminContext = createContext<AdminState | null>(null);
const STORAGE_KEY = "glitchRoulette.admin.v1";

function loadAdmin(): { enabled: boolean; overrides: Record<string, ProductOverride> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: false, overrides: {} };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { enabled: false, overrides: {} };
    const obj = parsed as { enabled?: unknown; overrides?: unknown };
    const enabled = Boolean(obj.enabled);
    const overrides =
      obj.overrides && typeof obj.overrides === "object"
        ? (obj.overrides as Record<string, ProductOverride>)
        : {};
    return { enabled, overrides };
  } catch {
    return { enabled: false, overrides: {} };
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [{ enabled, overrides }, setState] = useState(() => loadAdmin());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, overrides }));
    } catch {
      // ignore
    }
  }, [enabled, overrides]);

  const value = useMemo<AdminState>(
    () => ({
      enabled,
      toggle: () => setState((s) => ({ ...s, enabled: !s.enabled })),
      setEnabled: (v) => setState((s) => ({ ...s, enabled: v })),
      overrides,
      setOverride: (productId, next) =>
        setState((s) => ({
          ...s,
          overrides: { ...s.overrides, [productId]: { ...s.overrides[productId], ...next } },
        })),
      clearOverrides: () => setState((s) => ({ ...s, overrides: {} })),
    }),
    [enabled, overrides],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

