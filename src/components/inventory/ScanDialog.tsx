import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Plus, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventory } from "@/context/InventoryContext";
import { findScannedItems, validStockAmount } from "@/lib/scanning";
import { CameraScanner } from "./CameraScanner";
import { ItemFormSheet } from "./ItemFormSheet";

export function ScanDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle>Scan an item</DialogTitle>
        <DialogDescription>Barcode / QR lookup & stock entry</DialogDescription>
      </DialogHeader>
      {open && <ScanContent close={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>;
}

function ScanContent({ close }: { close: () => void }) {
  const { items, adjustStock, undoMovement } = useInventory();
  const navigate = useNavigate();
  const [mode, setMode] = useState("lookup");
  const [code, setCode] = useState("");
  const [selected, setSelected] = useState("");
  const [amount, setAmount] = useState("1");
  const [saved, setSaved] = useState(false);
  const [creating, setCreating] = useState(false);
  const matches = findScannedItems(items, code);
  const item = matches.find((i) => i.id === selected) ?? (matches.length === 1 ? matches[0] : undefined);
  const units = validStockAmount(amount);
  const reset = () => { setCode(""); setSelected(""); setAmount("1"); setSaved(false); };

  return <div className="space-y-4">
    <Tabs value={mode} onValueChange={setMode}>
      <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="lookup">Look up item</TabsTrigger><TabsTrigger value="stock">Add stock</TabsTrigger></TabsList>
    </Tabs>
    {!code ? <CameraScanner onRead={(value) => { setCode(value); setSaved(false); }} /> : <>
      <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">{code}</p>
      {!matches.length ? <div className="space-y-3"><p role="status" className="text-sm text-muted-foreground">No item has this barcode, QR tag or SKU.</p><Button className="w-full" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Create item with this code</Button><ItemFormSheet open={creating} onOpenChange={setCreating} defaults={{ barcode: code }} /></div> : <>
        {matches.length > 1 && <div className="space-y-2"><p className="text-sm text-warning-foreground">Multiple items share this code. Select an item.</p>{matches.map((match) => <Button key={match.id} variant={selected === match.id ? "secondary" : "outline"} className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => { setSelected(match.id); setSaved(false); }}><span>{match.name} · {match.sku}</span></Button>)}</div>}
        {item && <div className="space-y-3">
          <div><h3 className="break-words text-lg font-semibold">{item.name}</h3><p className="text-sm text-muted-foreground">{item.sku} · {item.quantity} units in stock</p>{item.location && <p className="text-sm text-muted-foreground">{item.location}</p>}</div>
          {mode === "lookup" ? <Button className="w-full" onClick={() => { close(); void navigate({ to: "/items/$id", params: { id: item.id } }); }}>Open item <ArrowRight className="h-4 w-4" /></Button> : <>
            <div className="space-y-1.5"><Label htmlFor="scan-amount">Units to add</Label><Input id="scan-amount" type="number" min="1" step="1" value={amount} disabled={saved} onChange={(e) => setAmount(e.target.value)} />{!units && <p className="text-xs text-destructive">Enter a positive whole number.</p>}</div>
            <Button className="w-full" disabled={!units || saved || !Number.isSafeInteger(item.quantity + (units ?? 0))} onClick={() => {
              if (!units || saved) return;
              const movement = adjustStock(item.id, units, { reason: "Purchase", source: "restock", note: `Scanned code: ${code}` });
              if (!movement) return;
              setSaved(true);
              toast.success(`Added ${units} units to ${item.name}`, { action: { label: "Undo", onClick: () => { undoMovement(movement); setSaved(false); } } });
            }}>{saved ? <><Check className="h-4 w-4" /> Stock added</> : <><Plus className="h-4 w-4" /> Add {units ?? ""} units</>}</Button>
          </>}
        </div>}
      </>}
      <Button variant="outline" className="w-full" onClick={reset}><ScanLine className="h-4 w-4" /> Scan next item</Button>
    </>}
  </div>;
}