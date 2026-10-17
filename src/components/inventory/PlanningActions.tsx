import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, ListPlus, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Item } from "@/lib/types";
import { reorderCsv, reorderItems, suggestedReorder } from "@/lib/asset-planning";
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
  const list = reorderItems(items);
  return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}><ListPlus className="h-4 w-4" /> Create reorder list</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="w-[calc(100%-2rem)] max-w-3xl max-h-[85dvh] overflow-y-auto rounded-lg">
      <DialogHeader><DialogTitle>Reorder list</DialogTitle><DialogDescription>{list.length} inventory items · Target: twice each reorder level, minimum 1 unit. Fixed assets excluded.</DialogDescription></DialogHeader>
      {!list.length ? <p className="text-sm text-muted-foreground">No inventory items need reordering.</p> : <>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Item / SKU</th><th className="p-2">Location</th><th className="p-2">Current</th><th className="p-2">Level</th><th className="p-2">Suggested</th><th className="p-2">Est. cost</th></tr></thead><tbody>{list.map((i) => <tr key={i.id} className="border-b"><td className="p-2">{i.name}<p className="font-mono text-xs text-muted-foreground">{i.sku}</p></td><td className="p-2">{i.location || "—"}</td><td className="p-2">{i.quantity}</td><td className="p-2">{i.reorderLevel}</td><td className="p-2 font-semibold">{suggestedReorder(i)}</td><td className="p-2">{(suggestedReorder(i) * i.unitPrice).toFixed(2)}</td></tr>)}</tbody></table></div>
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button disabled={busy}><Download className="h-4 w-4" /> {busy ? "Preparing…" : "Export"} <ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { const url = URL.createObjectURL(new Blob([reorderCsv(items)], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "stockroom-reorder.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}><FileSpreadsheet className="h-4 w-4" /> Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { setBusy(true); try { (await reorderPdf(items)).save("stockroom-reorder.pdf"); } catch { toast.error("Could not create the PDF. Please try again."); } finally { setBusy(false); } }}><FileText className="h-4 w-4" /> Export PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { setBusy(true); try { printPdf(await reorderPdf(items)); } catch { toast.error("Could not open the print view. Allow pop-ups and try again."); } finally { setBusy(false); } }}><Printer className="h-4 w-4" /> Print list</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>}
    </DialogContent></Dialog>
  </>;
}