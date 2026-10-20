import type { Item } from "./types";
import { getCurrency } from "./currency";

export function suggestedReorder(item: Item) {
  if (item.itemType === "asset" || item.quantity > item.reorderLevel) return 0;
  return Math.max(0, Math.max(1, Math.ceil(item.reorderLevel * 2)) - item.quantity);
}

export function reorderItems(items: Item[]) {
  return items.filter((i) => suggestedReorder(i) > 0);
}

export function warrantyStatus(item: Item, today: string): "expired" | "expiring" | "active" | null {
  if (item.itemType !== "asset" || !item.warrantyExpiry) return null;
  const end = Date.parse(`${item.warrantyExpiry}T00:00:00Z`);
  const start = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(end) || !Number.isFinite(start)) return null;
  const days = Math.round((end - start) / 86400000);
  return days < 0 ? "expired" : days <= 30 ? "expiring" : "active";
}

export function labelCode(item: Item) { return item.qrCode.trim() || item.sku.trim(); }

/** Custom order quantities keyed by item id; 0 removes the item from the list. */
export type ReorderOverrides = Record<string, number>;

export function orderQuantity(item: Item, overrides?: ReorderOverrides) {
  const o = overrides?.[item.id];
  return o !== undefined && Number.isSafeInteger(o) && o >= 0 ? o : suggestedReorder(item);
}

export function reorderLines(items: Item[], overrides?: ReorderOverrides) {
  return reorderItems(items).map((item) => ({ item, qty: orderQuantity(item, overrides) })).filter((l) => l.qty > 0);
}

export function reorderCsv(items: Item[], overrides?: ReorderOverrides) {
  const cell = (v: string | number) => {
    const s = String(v);
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [`Name,SKU,Location,Current quantity,Reorder level,Order quantity,Unit price (${getCurrency()}),Estimated cost (${getCurrency()})`,
    ...reorderLines(items, overrides).map(({ item: i, qty }) => [i.name, i.sku, i.location, i.quantity, i.reorderLevel, qty, i.unitPrice, qty * i.unitPrice].map(cell).join(","))].join("\r\n");
}

export type OrderLine = { itemId: string; name: string; sku: string; qty: number; unitCost: number };

/** Supplier order totals; tax is a percentage of the subtotal, shipping a flat amount. */
export function orderTotals(lines: OrderLine[], taxPercent = 0, shipping = 0) {
  const round = (n: number) => Math.round(n * 100) / 100;
  const subtotal = round(lines.reduce((s, l) => s + Math.max(0, l.qty) * Math.max(0, l.unitCost), 0));
  const tax = round(subtotal * Math.max(0, taxPercent) / 100);
  const ship = round(Math.max(0, shipping));
  return { subtotal, tax, shipping: ship, total: round(subtotal + tax + ship) };
}
