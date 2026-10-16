import { describe, expect, it } from "vitest";
import { findScannedItems, validStockAmount } from "./scanning";
import type { Item } from "./types";

const items = [
  { id: "a", barcode: "0012345", qrCode: "ASSET-001", sku: "TOOL-01" },
  { id: "b", barcode: "0012345", qrCode: "ASSET-002", sku: "TOOL-02" },
] as Item[];

describe("camera item lookup", () => {
  it("looks up a barcode without losing leading zeros", () => {
    expect(findScannedItems(items, " 0012345 ").map((i) => i.id)).toEqual(["a", "b"]);
    expect(findScannedItems(items, "12345")).toEqual([]);
  });
  it("looks up QR tags and SKU codes exactly", () => {
    expect(findScannedItems(items, "ASSET-002").map((i) => i.id)).toEqual(["b"]);
    expect(findScannedItems(items, "TOOL-01").map((i) => i.id)).toEqual(["a"]);
    expect(findScannedItems(items, "ASSET")).toEqual([]);
  });
  it("never matches a blank code", () => expect(findScannedItems(items, " ")).toEqual([]));
});

describe("quick restock amount", () => {
  it("accepts positive whole units", () => {
    expect(validStockAmount("1")).toBe(1);
    expect(validStockAmount("12")).toBe(12);
  });
  it("rejects empty, negative, fractional and invalid quantities", () => {
    for (const value of ["", "0", "-1", "1.5", "no", "Infinity", "9007199254740992"]) {
      expect(validStockAmount(value)).toBeNull();
    }
  });
});