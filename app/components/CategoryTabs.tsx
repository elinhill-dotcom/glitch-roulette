"use client";

import type { MenuCategoryId } from "../lib/types";
import { Tabs } from "./ui/Tabs";

export function CategoryTabs({
  value,
  onValueChange,
  items,
}: {
  value: MenuCategoryId;
  onValueChange: (v: MenuCategoryId) => void;
  items: Array<{ id: MenuCategoryId; label: string; accent: "green" | "orange" }>;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      items={items.map((x) => ({ id: x.id, label: x.label, tone: x.accent }))}
    />
  );
}

