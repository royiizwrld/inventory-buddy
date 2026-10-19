import { describe, expect, it } from "vitest";
import { convertToBase } from "./exchange-rates";

const rates = { base: "KES", fetchedAt: 0, rates: { KES: 1, USD: 0.0077, EUR: 0.0071 } };

describe("convertToBase", () => {
  it("converts a foreign amount into the app currency", () => {
    expect(convertToBase(25, "USD", rates)).toBe(3246.75);
  });
  it("keeps amounts already in the app currency", () => {
    expect(convertToBase(500, "KES", rates)).toBe(500);
  });
  it("refuses unknown currencies and negative amounts", () => {
    expect(convertToBase(10, "XYZ", rates)).toBeNull();
    expect(convertToBase(-1, "USD", rates)).toBeNull();
  });
});
