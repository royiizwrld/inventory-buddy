import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventory } from "@/context/InventoryContext";
import { DEFAULT_REORDER_LEVEL } from "@/lib/inventory";
import type { Item, ItemInput } from "@/lib/types";

const blank: ItemInput = {
  name: "", sku: "", category: "Other", quantity: 0, unitPrice: 0, location: "", reorderLevel: DEFAULT_REORDER_LEVEL,
  notes: "", itemType: "inventory", barcode: "", qrCode: "",
  purchaseDate: "", warrantyExpiry: "", assignedPerson: "", condition: "",
};

/** Field for a code value. `onScan` slot is where a camera scanner can be wired in later. */
function CodeField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label} <span className="text-muted-foreground">(optional)</span></Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type or scan" className="font-mono" />
    </div>
  );
}

function PickOrAdd({ label, value, options, onChange, onAdd }: { label: string; value: string; options: string[]; onChange: (v: string) => void; onAdd: (v: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {adding ? (
        <div className="flex gap-2">
          <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`New ${label.toLowerCase()}`} />
          <Button type="button" size="sm" onClick={() => { if (draft.trim()) { onAdd(draft.trim()); onChange(draft.trim()); } setAdding(false); setDraft(""); }}>Add</Button>
        </div>
      ) : (
        <Select value={value || "__none"} onValueChange={(v) => (v === "__add" ? setAdding(true) : onChange(v === "__none" ? "" : v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {label === "Location" && <SelectItem value="__none">No location</SelectItem>}
            {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            <SelectItem value="__add">+ Add new…</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function ItemFormSheet({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item?: Item | null }) {
  const { addItem, updateItem, isSkuTaken, categories, locations, addCategory, addLocation } = useInventory();
  const [f, setF] = useState<ItemInput>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof ItemInput, string>>>({});

  useEffect(() => {
    if (open) {
      setF(item ? { ...blank, ...item } : blank);
      setErrors({});
    }
  }, [open, item]);

  const set = <K extends keyof ItemInput>(k: K, v: ItemInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Partial<Record<keyof ItemInput, string>> = {};
    if (!f.name.trim()) er.name = "Name is required";
    if (!f.sku.trim()) er.sku = "SKU is required";
    else if (isSkuTaken(f.sku, item?.id)) er.sku = "This SKU is already used by another item";
    if (!Number.isFinite(f.quantity) || f.quantity < 0 || !Number.isInteger(f.quantity)) er.quantity = "Quantity must be a whole number, 0 or more";
    if (!Number.isFinite(f.unitPrice) || f.unitPrice < 0) er.unitPrice = "Price can't be negative";
    if (!Number.isFinite(f.reorderLevel) || f.reorderLevel < 0) er.reorderLevel = "Reorder level can't be negative";
    if (f.itemType === "asset" && f.purchaseDate && f.warrantyExpiry && f.warrantyExpiry < f.purchaseDate) er.warrantyExpiry = "Warranty expiry must be on or after the purchase date";
    setErrors(er);
    if (Object.keys(er).length) return;
    const clean = { ...f, name: f.name.trim(), sku: f.sku.trim(), barcode: f.barcode.trim(), qrCode: f.qrCode.trim() };
    if (item) {
      updateItem(item.id, clean);
      toast.success(`Saved changes to ${clean.name}`);
    } else {
      addItem(clean);
      toast.success(`Added ${clean.name}`);
    }
    onOpenChange(false);
  };

  const num = (k: "quantity" | "unitPrice" | "reorderLevel", label: string, step = "1") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type="number" min={0} step={step} value={Number.isNaN(f[k]) ? "" : f[k]} onChange={(e) => set(k, e.target.value === "" ? NaN : Number(e.target.value))} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{item ? "Edit item" : "Add item"}</SheetTitle>
            <SheetDescription>Quantity changes are recorded in the stock history.</SheetDescription>
          </SheetHeader>
          <div className="grid flex-1 gap-4 px-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={f.sku} onChange={(e) => set("sku", e.target.value)} className="font-mono" />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Item type</Label>
              <Select value={f.itemType} onValueChange={(v) => set("itemType", v as ItemInput["itemType"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory item</SelectItem>
                  <SelectItem value="asset">Fixed asset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PickOrAdd label="Category" value={f.category} options={categories} onChange={(v) => set("category", v)} onAdd={addCategory} />
            <PickOrAdd label="Location" value={f.location} options={locations} onChange={(v) => set("location", v)} onAdd={addLocation} />
            {num("quantity", "Quantity")}
            {num("unitPrice", "Unit price", "0.01")}
            {num("reorderLevel", "Reorder level")}
            <div />
            <CodeField id="barcode" label="Barcode" value={f.barcode} onChange={(v) => set("barcode", v)} />
            <CodeField id="qr" label="QR code / asset tag" value={f.qrCode} onChange={(v) => set("qrCode", v)} />
            {f.itemType === "asset" && <>
              <h3 className="border-t pt-3 font-semibold sm:col-span-2">Asset tracking</h3>
              <div className="space-y-1.5"><Label htmlFor="purchaseDate">Purchase date</Label><Input id="purchaseDate" type="date" value={f.purchaseDate ?? ""} onChange={(e) => set("purchaseDate", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="warrantyExpiry">Warranty expiry</Label><Input id="warrantyExpiry" type="date" min={f.purchaseDate || undefined} value={f.warrantyExpiry ?? ""} onChange={(e) => set("warrantyExpiry", e.target.value)} />{errors.warrantyExpiry && <p className="text-xs text-destructive">{errors.warrantyExpiry}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="assignedPerson">Assigned person</Label><Input id="assignedPerson" value={f.assignedPerson ?? ""} onChange={(e) => set("assignedPerson", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="condition">Condition</Label><Select value={f.condition || "__none"} onValueChange={(v) => set("condition", v === "__none" ? "" : v)}><SelectTrigger id="condition"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none">Not specified</SelectItem>{["New", "Good", "Fair", "Poor", "Needs repair", "Retired"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </>}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </div>
          </div>
          <SheetFooter className="flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{item ? "Save changes" : "Add item"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
