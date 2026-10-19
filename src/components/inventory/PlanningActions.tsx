import { formatCurrency } from "@/lib/currency";
import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, ListPlus, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Item } from "@/lib/types";
import { orderQuantity, reorderCsv, reorderItems, reorderLines, suggestedReorder, type ReorderOverrides } from "@/lib/asset-planning";
import { labelsPdf, printPdf, reorderPdf } from "@/lib/inventory-documents";

export function LabelButton({ items }: { items: Item[] }) {
  const [busy, setBusy] = useState(false);
  return <Button variant="outline" size="sm" disabled={busy || !items.length} onClick={async () => {
    setBusy(true);
    try { (await labelsPdf(items)).save("stockroom-qr-labels.pdf"); toast.success("Printable QR labels downloaded"); }
    catch { toast.error("Could not create the labels. Please try again."); }
    finally { setBusy(false); }
  }}><Printer className="h-4 w-4" /> {busy ? "Preparing…" : items.length === 1 ? "Print QR label" : "Print QR labels"}</Button>;
}

export function ReorderButton({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [overrides, setOverrides] = useState<ReorderOverrides>({});
  const list = reorderItems(items);
  const lines = reorderLines(items, overrides);
  const total = lines.reduce((s, l) => s + l.qty * l.item.unitPrice, 0);
  const edited = Object.keys(overrides).length > 0;
  const setQty = (id: string, raw: string) => {
    const n = raw === "" ? 0 : Math.floor(Number(raw));
    if (!Number.isFinite(n) || n < 0) return;
    setOverrides((o) => ({ ...o, [id]: n }));
  };
  return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}><ListPlus className="h-4 w-4" /> Create reorder list</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="w-[calc(100%-2rem)] max-w-3xl max-h-[85dvh] overflow-y-auto rounded-lg">
      <DialogHeader><DialogTitle>Reorder list</DialogTitle><DialogDescription>Quantities start at twice each reorder level. Change any number, or untick an item to leave it out. Fixed assets excluded.</DialogDescription></DialogHeader>
      {!list.length ? <p className="text-sm text-muted-foreground">No inventory items need reordering.</p> : <>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2"></th><th className="p-2">Item / SKU</th><th className="p-2">Location</th><th className="p-2">Current</th><th className="p-2">Level</th><th className="p-2">Order qty</th><th className="p-2">Est. cost</th></tr></thead><tbody>{list.map((i) => {
          const qty = orderQuantity(i, overrides);
          const included = qty > 0;
          return <tr key={i.id} className={`border-b ${included ? "" : "opacity-50"}`}>
            <td className="p-2"><Checkbox aria-label={`Include ${i.name}`} checked={included} onCheckedChange={(c) => setOverrides((o) => { const n = { ...o }; if (c) delete n[i.id]; else n[i.id] = 0; return n; })} /></td>
            <td className="p-2">{i.name}<p className="font-mono text-xs text-muted-foreground">{i.sku}</p></td><td className="p-2">{i.location || "—"}</td><td className="p-2">{i.quantity}</td><td className="p-2">{i.reorderLevel}</td>
            <td className="p-2"><Input aria-label={`Order quantity for ${i.name}`} type="number" min={0} step={1} inputMode="numeric" className="h-8 w-20" value={qty} onChange={(e) => setQty(i.id, e.target.value)} />{overrides[i.id] !== undefined && overrides[i.id] !== suggestedReorder(i) && <p className="text-xs text-muted-foreground">Suggested {suggestedReorder(i)}</p>}</td>
            <td className="p-2">{formatCurrency(qty * i.unitPrice)}</td></tr>;
        })}</tbody></table></div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{lines.length} items · Est. total {formatCurrency(total)}</p>
          <div className="flex gap-2">
          {edited && <Button variant="ghost" onClick={() => setOverrides({})}><RotateCcw className="h-4 w-4" /> Reset to suggestions</Button>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button disabled={busy || !lines.length}><Download className="h-4 w-4" /> {busy ? "Preparing…" : "Export"} <ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { const url = URL.createObjectURL(new Blob([reorderCsv(items, overrides)], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "stockroom-reorder.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}><FileSpreadsheet className="h-4 w-4" /> Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { setBusy(true); try { (await reorderPdf(items, overrides)).save("stockroom-reorder.pdf"); } catch { toast.error("Could not create the PDF. Please try again."); } finally { setBusy(false); } }}><FileText className="h-4 w-4" /> Export PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { setBusy(true); try { printPdf(await reorderPdf(items, overrides)); } catch { toast.error("Could not open the print view. Allow pop-ups and try again."); } finally { setBusy(false); } }}><Printer className="h-4 w-4" /> Print list</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </>}
    </DialogContent></Dialog>
  </>;
}