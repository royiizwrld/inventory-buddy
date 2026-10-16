import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { InventoryState, Item, ItemInput, Movement, MovementReason, MovementSource } from "@/lib/types";
import { DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, getStatus, uid } from "@/lib/inventory";
import { makeSeed } from "@/lib/seed";

const KEY = "inventory-logger:v1";
const SEEDED = "inventory-logger:seeded";

const empty: InventoryState = { items: [], categories: [...DEFAULT_CATEGORIES], locations: [...DEFAULT_LOCATIONS], movements: [] };

interface Ctx extends InventoryState {
  ready: boolean;
  hasSample: boolean;
  addItem: (input: ItemInput, source?: MovementSource) => Item;
  updateItem: (id: string, input: ItemInput, reason?: MovementReason) => void;
  deleteItem: (id: string) => void;
  adjustStock: (id: string, delta: number, opts?: { reason?: MovementReason | undefined; source?: MovementSource; note?: string }) => string | null;
  undoMovement: (movementId: string) => void;
  addCategory: (c: string) => void;
  addLocation: (l: string) => void;
  clearSample: () => void;
  isSkuTaken: (sku: string, exceptId?: string) => boolean;
  getStatus: typeof getStatus;
}

const InventoryContext = createContext<Ctx | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(empty);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...empty, ...JSON.parse(raw) });
      else if (!localStorage.getItem(SEEDED)) {
        setState(makeSeed());
        localStorage.setItem(SEEDED, "1");
      }
    } catch {
      /* corrupted storage: start empty */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const mkMove = (item: Item, change: number, resultingQty: number, source: MovementSource, reason?: MovementReason, note?: string): Movement => ({
    id: uid(), itemId: item.id, itemName: item.name, date: new Date().toISOString(), change, resultingQty, source, reason, note,
  });

  const addItem = useCallback((input: ItemInput, source: MovementSource = "create") => {
    const now = new Date().toISOString();
    const item: Item = { ...input, id: uid(), createdAt: now, updatedAt: now };
    setState((s) => ({
      ...s,
      items: [item, ...s.items],
      movements: item.quantity
        ? [...s.movements, mkMove(item, item.quantity, item.quantity, source, source === "create" ? undefined : "Purchase")]
        : s.movements,
      categories: s.categories.includes(item.category) || !item.category ? s.categories : [...s.categories, item.category],
      locations: s.locations.includes(item.location) || !item.location ? s.locations : [...s.locations, item.location],
    }));
    return item;
  }, []);

  const updateItem = useCallback((id: string, input: ItemInput, reason?: MovementReason) => {
    setState((s) => {
      const old = s.items.find((i) => i.id === id);
      if (!old) return s;
      const next: Item = { ...old, ...input, sample: old.sample, updatedAt: new Date().toISOString() };
      const diff = next.quantity - old.quantity;
      return {
        ...s,
        items: s.items.map((i) => (i.id === id ? next : i)),
        movements: diff ? [...s.movements, mkMove(next, diff, next.quantity, "manual", reason ?? "Correction")] : s.movements,
        categories: s.categories.includes(next.category) || !next.category ? s.categories : [...s.categories, next.category],
        locations: s.locations.includes(next.location) || !next.location ? s.locations : [...s.locations, next.location],
      };
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  }, []);

  const adjustStock: Ctx["adjustStock"] = useCallback((id, delta, opts = {}) => {
    const item = stateRef.current.items.find((i) => i.id === id);
    if (!item || !delta) return null;
    const qty = Math.max(0, item.quantity + delta);
    const change = qty - item.quantity;
    if (!change) return null;
    const mv = mkMove(item, change, qty, opts.source ?? (change > 0 ? "restock" : "remove"), opts.reason, opts.note);
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + change), updatedAt: mv.date } : i)),
      movements: [...s.movements, mv],
    }));
    return mv.id;
  }, []);

  const undoMovement = useCallback((movementId: string) => {
    setState((s) => {
      const mv = s.movements.find((m) => m.id === movementId);
      if (!mv) return s;
      return {
        ...s,
        items: s.items.map((i) => (i.id === mv.itemId ? { ...i, quantity: Math.max(0, i.quantity - mv.change) } : i)),
        movements: s.movements.filter((m) => m.id !== movementId),
      };
    });
  }, []);

  const addCategory = useCallback((c: string) => {
    const v = c.trim();
    if (v) setState((s) => (s.categories.some((x) => x.toLowerCase() === v.toLowerCase()) ? s : { ...s, categories: [...s.categories, v] }));
  }, []);
  const addLocation = useCallback((l: string) => {
    const v = l.trim();
    if (v) setState((s) => (s.locations.some((x) => x.toLowerCase() === v.toLowerCase()) ? s : { ...s, locations: [...s.locations, v] }));
  }, []);

  const clearSample = useCallback(() => {
    setState((s) => {
      const ids = new Set(s.items.filter((i) => i.sample).map((i) => i.id));
      return { ...s, items: s.items.filter((i) => !ids.has(i.id)), movements: s.movements.filter((m) => !ids.has(m.itemId)) };
    });
  }, []);

  const isSkuTaken = useCallback(
    (sku: string, exceptId?: string) =>
      stateRef.current.items.some((i) => i.id !== exceptId && i.sku.trim().toLowerCase() === sku.trim().toLowerCase()),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state, ready, hasSample: state.items.some((i) => i.sample),
      addItem, updateItem, deleteItem, adjustStock, undoMovement, addCategory, addLocation, clearSample, isSkuTaken, getStatus,
    }),
    [state, ready, addItem, updateItem, deleteItem, adjustStock, undoMovement, addCategory, addLocation, clearSample, isSkuTaken],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside InventoryProvider");
  return ctx;
}
