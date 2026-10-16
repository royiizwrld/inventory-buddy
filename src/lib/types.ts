export type ItemType = "inventory" | "asset";
export type StockStatus = "in" | "low" | "out";
export type MovementReason = "Purchase" | "Sale" | "Damaged" | "Lost" | "Correction" | "Other";
export type MovementSource = "manual" | "restock" | "remove" | "import" | "bulk" | "create" | "assistant";

export const MOVEMENT_REASONS: MovementReason[] = ["Purchase", "Sale", "Damaged", "Lost", "Correction", "Other"];

export interface Item {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  location: string;
  reorderLevel: number;
  notes: string;
  itemType: ItemType;
  barcode: string;
  qrCode: string;
  sample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemInput = Omit<Item, "id" | "createdAt" | "updatedAt">;

export interface Movement {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  change: number;
  resultingQty: number;
  reason?: MovementReason;
  source: MovementSource;
  note?: string;
}

export interface InventoryState {
  items: Item[];
  categories: string[];
  locations: string[];
  movements: Movement[];
}
