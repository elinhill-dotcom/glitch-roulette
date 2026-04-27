"use client";

import React from "react";
import { AdminProvider } from "./state/admin";
import { CartProvider } from "./state/cart";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <CartProvider>{children}</CartProvider>
    </AdminProvider>
  );
}

