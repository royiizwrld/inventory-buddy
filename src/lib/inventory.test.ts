import { describe, expect, it } from "vitest";
import { getStatus, findMatch, DEFAULT_REORDER_LEVEL } from "./inventory";
import type { Item } from "./types";

describe("getStatus", () => {
  it("is out of stock at quantity 0", () => expect(getStatus({ quantity: 0, reorderLevel: 5 })).toBe("out"));
  it("is low stock at the reorder level", () => expect(getStatus({ quantity: 5, reorderLevel: 5 })).toBe("low"));
  it("is low stock below the reorder level", () => expect(getStatus({ quantity: 2, reorderLevel: 5 })).toBe("low"));
  it("is in stock above the reorder level", () => expect(getStatus({ quantity: 6, reorderLevel: 5 })).toBe("in"));
  it("defaults reorder level to 5", () => expect(DEFAULT_REORDER_LEVEL).toBe(5));
});

describe("findMatch", () => {
  const base = { id: "1", name: "HDMI Cable 2m", sku: "HDM-001" } as Item;
  it("matches by SKU case-insensitively", () => expect(findMatch([base], "x", "hdm-001")?.id).toBe("1"));
  it("matches by similar name", () => expect(findMatch([base], "hdmi cable")?.id).toBe("1"));
  it("returns nothing for unrelated names", () => expect(findMatch([base], "Office chair")).toBeUndefined());
});
