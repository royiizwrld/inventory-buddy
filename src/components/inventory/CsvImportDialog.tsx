import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/context/InventoryContext";
import { DEFAULT_REORDER_LEVEL } from "@/lib/inventory";
import type { ItemInput } from "@/lib/types";

interface Row { data: ItemInput; errors: string[] }

export function CsvImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { items, addItem } = useInventory();
  const [rows, setRows] = useState<Row[]>([]);

  const parse = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const seen = new Set<string>();
        const existing = new Set(items.map((i) => i.sku.toLowerCase()));
        const get = (r: Record<string, string>, ...keys: string[]) => {
          for (const k of keys) {
            const hit = Object.keys(r).find((h) => h.toLowerCase().replace(/[\s_]/g, "") === k.toLowerCase());
            if (hit && r[hit] != null) return String(r[hit]).trim();
          }
          return "";
        };
        setRows(
          res.data.map((r) => {
            const qty = Number(get(r, "quantity", "qty") || 0);
            const price = Number(get(r, "unitprice", "price") || 0);
            const rl = get(r, "reorderlevel");
            const data: ItemInput = {
              name: get(r, "name"), sku: get(r, "sku"), category: get(r, "category") || "Other",
              quantity: qty, unitPrice: price, location: get(r, "location"),
              reorderLevel: rl === "" ? DEFAULT_REORDER_LEVEL : Number(rl),
              itemType: /asset/i.test(get(r, "itemtype", "type")) ? "asset" : "inventory",
              barcode: get(r, "barcode"), qrCode: get(r, "qrcode", "assettag"), notes: get(r, "notes"),
            };
            const errors: string[] = [];
            if (!data.name) errors.push("Missing name");
            if (!data.sku) errors.push("Missing SKU");
            const k = data.sku.toLowerCase();
            if (data.sku && existing.has(k)) errors.push("Duplicate SKU (exists)");
            if (data.sku && seen.has(k)) errors.push("Duplicate SKU in file");
            seen.add(k);
            if (!Number.isInteger(qty) || qty < 0) errors.push("Invalid quantity");
            if (!Number.isFinite(price) || price < 0) errors.push("Invalid price");
            if (!Number.isFinite(data.reorderLevel) || data.reorderLevel < 0) errors.push("Invalid reorder level");
            return { data, errors };
          }),
        );
      },
      error: () => toast.error("Couldn't read that CSV file."),
    });
  };

  const valid = rows.filter((r) => !r.errors.length);
  const save = () => {
    valid.forEach((r) => addItem(r.data, "import"));
    toast.success(`Imported ${valid.length} item${valid.length === 1 ? "" : "s"}`);
    setRows([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setRows([]); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>Columns: name, sku, category, quantity, unitPrice, location, reorderLevel, itemType, barcode, qrCode, notes.</DialogDescription>
        </DialogHeader>
        {!rows.length ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-sm text-muted-foreground hover:bg-muted/50">
            <Upload className="h-6 w-6" /> Choose a .csv file
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} />
          </label>
        ) : (
          <div className="max-h-[50vh] overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left"><tr><th className="p-2">Name</th><th className="p-2">SKU</th><th className="p-2">Qty</th><th className="p-2">Price</th><th className="p-2">Issues</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={r.errors.length ? "bg-destructive/10" : ""}>
                    <td className="p-2">{r.data.name}</td><td className="p-2 font-mono">{r.data.sku}</td>
                    <td className="p-2">{r.data.quantity}</td><td className="p-2">{r.data.unitPrice}</td>
                    <td className="p-2 text-xs text-destructive">{r.errors.join(", ") || <span className="text-success">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DialogFooter>
          {rows.length > 0 && <p className="mr-auto self-center text-sm text-muted-foreground">{valid.length} of {rows.length} rows ready · rows with issues will be skipped</p>}
          <Button variant="outline" onClick={() => setRows([])} disabled={!rows.length}>Reset</Button>
          <Button onClick={save} disabled={!valid.length}>Import {valid.length || ""} items</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
