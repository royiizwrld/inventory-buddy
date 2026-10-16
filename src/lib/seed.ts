import type { InventoryState, Item, Movement } from "./types";
import { DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, uid } from "./inventory";

export function makeSeed(): InventoryState {
  const now = Date.now();
  const d = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
  const raw: Array<Partial<Item> & Pick<Item, "name" | "sku" | "category" | "quantity" | "unitPrice" | "location">> = [
    { name: "A4 Paper Ream", sku: "OFF-A4-001", category: "Office Supplies", quantity: 3, unitPrice: 650, location: "Shelf B2", reorderLevel: 10 },
    { name: "HDMI Cable 2m", sku: "ELE-HDM-002", category: "Electronics", quantity: 30, unitPrice: 400, location: "Shelf A1" },
    { name: "Office Chair Ergonomic", sku: "FUR-CHR-003", category: "Furniture", quantity: 5, unitPrice: 8500, location: "Store Room", reorderLevel: 2 },
    { name: "Dell Latitude Laptop", sku: "ELE-LAP-004", category: "Electronics", quantity: 1, unitPrice: 45000, location: "Office", reorderLevel: 0, itemType: "asset", qrCode: "LT-014", barcode: "5901234123457" },
    { name: "Cordless Drill", sku: "TOO-DRL-005", category: "Tools", quantity: 0, unitPrice: 6200, location: "Store Room", reorderLevel: 1 },
    { name: "Ballpoint Pens (box)", sku: "OFF-PEN-006", category: "Office Supplies", quantity: 42, unitPrice: 250, location: "Shelf B2" },
    { name: "USB-C Charger", sku: "ELE-USB-007", category: "Electronics", quantity: 4, unitPrice: 1800, location: "Shelf A1" },
    { name: "Whiteboard Markers", sku: "OFF-MRK-008", category: "Office Supplies", quantity: 12, unitPrice: 0, location: "" },
  ];
  const items: Item[] = raw.map((r, idx) => ({
    id: uid() + idx,
    reorderLevel: 5,
    notes: "",
    itemType: "inventory",
    barcode: "",
    qrCode: "",
    ...r,
    sample: true,
    createdAt: d(70),
    updatedAt: d(1),
  }));
  const movements: Movement[] = [];
  const add = (i: Item, daysAgo: number, change: number, reason?: Movement["reason"]) =>
    movements.push({ id: uid(), itemId: i.id, itemName: i.name, date: d(daysAgo), change, resultingQty: 0, reason, source: change > 0 ? "restock" : "remove" });
  const [paper, hdmi, , , drill, , usb] = items;
  add(paper, 28, 20, "Purchase"); add(paper, 21, -6, "Sale"); add(paper, 14, -5, "Sale"); add(paper, 7, -4, "Sale"); add(paper, 2, -2, "Sale");
  add(hdmi, 40, 10, "Purchase"); add(hdmi, 10, -2, "Sale");
  add(drill, 20, -1, "Damaged");
  add(usb, 12, -3, "Sale"); add(usb, 3, -1, "Lost");
  // compute resulting quantities backwards from current stock
  for (const it of items) {
    const ms = movements.filter((m) => m.itemId === it.id).sort((a, b) => b.date.localeCompare(a.date));
    let q = it.quantity;
    for (const m of ms) { m.resultingQty = q; q -= m.change; }
  }
  return { items, categories: [...DEFAULT_CATEGORIES], locations: [...DEFAULT_LOCATIONS], movements };
}
