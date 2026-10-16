import type { Item } from "./types";

/** Codes are identifiers, not fuzzy search terms. Preserve leading zeros and case. */
export function findScannedItems(items: Item[], value: string): Item[] {
  const code = value.trim();
  if (!code) return [];
  return items.filter((item) => [item.barcode, item.qrCode, item.sku].some((v) => v?.trim() === code));
}

export function validStockAmount(value: string): number | null {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}