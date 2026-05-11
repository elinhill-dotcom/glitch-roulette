"use client";

import React from "react";
import { AdminProvider } from "./state/admin";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
