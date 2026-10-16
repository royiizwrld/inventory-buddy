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