import type { Item } from "./types";

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

export function reorderCsv(items: Item[]) {
  const cell = (v: string | number) => {
    const s = String(v);
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return ["Name,SKU,Location,Current quantity,Reorder level,Suggested quantity,Unit price,Estimated cost",
    ...reorderItems(items).map((i) => [i.name, i.sku, i.location, i.quantity, i.reorderLevel, suggestedReorder(i), i.unitPrice, suggestedReorder(i) * i.unitPrice].map(cell).join(","))].join("\r\n");
}