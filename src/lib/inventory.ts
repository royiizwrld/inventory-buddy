import { formatCurrency } from "./currency";
import type { Item, Movement, StockStatus } from "./types";

export const DEFAULT_CATEGORIES = ["Electronics", "Office Supplies", "Furniture", "Tools", "Other"];
export const DEFAULT_LOCATIONS = ["Main Store", "Shelf A1", "Shelf B2", "Store Room", "Office"];
export const DEFAULT_REORDER_LEVEL = 5;

export function getStatus(item: Pick<Item, "quantity" | "reorderLevel">): StockStatus {
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.reorderLevel) return "low";
  return "in";
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  in: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

export function itemValue(i: Pick<Item, "quantity" | "unitPrice">) {
  return i.quantity * i.unitPrice;
}

export function formatMoney(n: number) {
  return formatCurrency(n);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function matchesSearch(item: Item, q: string) {
  if (!q.trim()) return true;
  const needle = q.toLowerCase().trim();
  return [item.name, item.sku, item.location, item.barcode, item.qrCode].some((f) =>
    (f || "").toLowerCase().includes(needle),
  );
}

/** Find a likely existing match by SKU first, then by similar name. */
export function findMatch(items: Item[], name: string, sku?: string): Item | undefined {
  if (sku) {
    const bySku = items.find((i) => i.sku.toLowerCase() === sku.toLowerCase());
    if (bySku) return bySku;
  }
  const n = normalize(name);
  if (!n) return undefined;
  return (
    items.find((i) => normalize(i.name) === n) ||
    items.find((i) => {
      const m = normalize(i.name);
      return m.length > 3 && n.length > 3 && (m.includes(n) || n.includes(m));
    })
  );
}

export function generateSku(name: string, existing: string[]) {
  const base =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.slice(0, 3))
      .slice(0, 2)
      .join("-") || "ITEM";
  const set = new Set(existing.map((s) => s.toLowerCase()));
  let n = 1;
  let sku = `${base}-${String(n).padStart(3, "0")}`;
  while (set.has(sku.toLowerCase())) {
    n++;
    sku = `${base}-${String(n).padStart(3, "0")}`;
  }
  return sku;
}

const DAY = 86400000;

/** Compact data summary sent to the AI assistant. Only computed facts, no guesses. */
export function buildSummary(items: Item[], movements: Movement[], now = Date.now()) {
  const byCat: Record<string, { items: number; units: number; value: number }> = {};
  const byLoc: Record<string, { items: number; units: number; value: number }> = {};
  for (const i of items) {
    const c = (byCat[i.category || "Uncategorized"] ??= { items: 0, units: 0, value: 0 });
    c.items++; c.units += i.quantity; c.value += itemValue(i);
    const l = (byLoc[i.location || "No location"] ??= { items: 0, units: 0, value: 0 });
    l.items++; l.units += i.quantity; l.value += itemValue(i);
  }
  const usage = (id: string, days: number) =>
    movements
      .filter((m) => m.itemId === id && m.change < 0 && now - new Date(m.date).getTime() <= days * DAY)
      .reduce((s, m) => s - m.change, 0);
  const lastMove = (id: string) => {
    const ms = movements.filter((m) => m.itemId === id && m.source !== "create");
    return ms.length ? Math.max(...ms.map((m) => new Date(m.date).getTime())) : undefined;
  };
  const compactItem = (i: Item) => {
    const used30 = usage(i.id, 30);
    const perDay = used30 / 30;
    const lm = lastMove(i.id);
    return {
      sku: i.sku, name: i.name, cat: i.category, loc: i.location || null, qty: i.quantity,
      reorder: i.reorderLevel, price: i.unitPrice, value: itemValue(i), status: getStatus(i), type: i.itemType,
      used30d: used30,
      daysUntilOut: perDay > 0 ? Math.round(i.quantity / perDay) : null,
      daysSinceLastMove: lm ? Math.round((now - lm) / DAY) : null,
    };
  };
  const all = items.map(compactItem);
  const names = items.map((i) => normalize(i.name));
  const dupes = items
    .filter((i, idx) => names.findIndex((n) => n === names[idx]) !== idx)
    .map((i) => i.name);
  return {
    generatedAt: new Date(now).toISOString(),
    totals: {
      distinctItems: items.length,
      units: items.reduce((s, i) => s + i.quantity, 0),
      value: items.reduce((s, i) => s + itemValue(i), 0),
      low: all.filter((i) => i.status === "low").length,
      out: all.filter((i) => i.status === "out").length,
    },
    valueByCategory: byCat,
    valueByLocation: byLoc,
    items: all,
    recentMovements: [...movements]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 40)
      .map((m) => ({ date: m.date.slice(0, 10), item: m.itemName, change: m.change, result: m.resultingQty, reason: m.reason ?? null, source: m.source })),
    historyDays: movements.length
      ? Math.round((now - Math.min(...movements.map((m) => new Date(m.date).getTime()))) / DAY)
      : 0,
    slowMoving60d: all.filter((i) => i.daysSinceLastMove === null || i.daysSinceLastMove >= 60).map((i) => i.sku),
    missingData: items
      .filter((i) => !i.unitPrice || !i.location)
      .map((i) => ({ sku: i.sku, missing: [!i.unitPrice && "price", !i.location && "location"].filter(Boolean) })),
    duplicateLookingNames: Array.from(new Set(dupes)),
  };
}

export const CSV_HEADERS = ["name", "sku", "category", "quantity", "unitPrice", "location", "reorderLevel", "itemType", "barcode", "qrCode", "notes"] as const;

export function itemsToCsv(items: Item[]) {
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map((i) => CSV_HEADERS.map((h) => esc(i[h])).join(","));
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}
