import { describe, it, expect } from "vitest";
import { labelCode, reorderItems, suggestedReorder, warrantyStatus, reorderCsv } from "./asset-planning";
import type { Item } from "./types";
const base = { name: "Cable", sku: "CAB-1", location: "Shelf A", qrCode: "", itemType: "inventory", quantity: 2, reorderLevel: 5, unitPrice: 10 } as Item;
describe("reorder planning", () => {
  it("suggests stock to reach twice the item's reorder level", () => expect(suggestedReorder(base)).toBe(8));
  it("includes threshold items but excludes stocked items and fixed assets", () => {
    expect(suggestedReorder({ ...base, quantity: 5 })).toBe(5);
    expect(reorderItems([{ ...base, quantity: 6 }, { ...base, itemType: "asset" }])).toEqual([]);
  });
  it("suggests one unit for an empty item with zero reorder level", () => expect(suggestedReorder({ ...base, quantity: 0, reorderLevel: 0 })).toBe(1));
  it("exports quantity and estimated cost", () => expect(reorderCsv([base])).toContain('"8","10","80"'));
});
describe("warranty alerts", () => {
  const asset = { ...base, itemType: "asset", warrantyExpiry: "2026-11-15" } as Item;
  it("alerts within 30 days including the expiry day", () => {
    expect(warrantyStatus(asset, "2026-10-16")).toBe("expiring");
    expect(warrantyStatus(asset, "2026-11-15")).toBe("expiring");
  });
  it("distinguishes active and expired warranties", () => {
    expect(warrantyStatus(asset, "2026-10-15")).toBe("active");
    expect(warrantyStatus(asset, "2026-11-16")).toBe("expired");
  });
  it("ignores missing dates and inventory warranties", () => {
    expect(warrantyStatus(base, "2026-10-16")).toBeNull();
    expect(warrantyStatus({ ...base, warrantyExpiry: asset.warrantyExpiry }, "2026-10-16")).toBeNull();
  });
});
it("QR labels reuse the asset tag or fall back to a scannable SKU", () => {
  expect(labelCode(base)).toBe("CAB-1");
  expect(labelCode({ ...base, qrCode: "ASSET-1" })).toBe("ASSET-1");
});
import { reorderLines as _rl, reorderCsv as _rc } from "./asset-planning";
describe("reorder overrides", () => {
  const it0 = { id: "a", name: "Pens", sku: "P1", location: "", quantity: 1, reorderLevel: 5, unitPrice: 2, itemType: "inventory" } as any;
  it("custom quantity replaces suggestion", () => { expect(_rl([it0], { a: 20 })[0]!.qty).toBe(20); expect(_rc([it0], { a: 20 })).toContain('"20","2","40"'); });
  it("zero removes item", () => { expect(_rl([it0], { a: 0 })).toHaveLength(0); });
  it("no override uses suggestion", () => { expect(_rl([it0])[0]!.qty).toBe(9); });
});

import { orderTotals } from "./asset-planning";
describe("orderTotals", () => {
  it("adds tax as a percentage and shipping as a flat amount", () => {
    const t = orderTotals([{ itemId: "a", name: "A", sku: "A", qty: 10, unitCost: 120 }, { itemId: "b", name: "B", sku: "B", qty: 5, unitCost: 30 }], 16, 500);
    expect(t).toEqual({ subtotal: 1350, tax: 216, shipping: 500, total: 2066 });
  });
});
