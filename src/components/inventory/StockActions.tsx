import { useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventory } from "@/context/InventoryContext";
import { MOVEMENT_REASONS, type Item, type MovementReason } from "@/lib/types";

function useStockChange() {
  const { adjustStock, undoMovement } = useInventory();
  return (item: Item, delta: number, reason?: MovementReason) => {
    const id = adjustStock(item.id, delta, reason ? { reason } : {});
    if (!id) {
      toast.error(delta < 0 ? "Nothing to remove — quantity is already 0." : "No change made.");
      return;
    }
    toast.success(`${delta > 0 ? "Restocked" : "Removed"} ${Math.abs(delta)} × ${item.name}`, {
      action: { label: "Undo", onClick: () => { undoMovement(id); toast("Change undone"); } },
    });
  };
}

function AmountPopover({ item, mode, children }: { item: Item; mode: "add" | "remove"; children: React.ReactNode }) {
  const change = useStockChange();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<MovementReason>(mode === "add" ? "Purchase" : "Sale");
  const apply = (n: number) => {
    if (!Number.isFinite(n) || n <= 0) { toast.error("Enter a positive whole number."); return; }
    change(item, mode === "add" ? Math.floor(n) : -Math.floor(n), reason);
    setOpen(false);
    setAmount("");
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="end">
        <p className="text-sm font-medium">{mode === "add" ? "Restock" : "Remove stock"}: {item.name}</p>
        {mode === "add" && (
          <div className="flex gap-2">
            {[5, 10, 25].map((n) => (
              <Button key={n} size="sm" variant="secondary" className="flex-1" onClick={() => apply(n)}>+{n}</Button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input type="number" min={1} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply(Number(amount))} />
          <Button size="sm" onClick={() => apply(Number(amount))}>Apply</Button>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reason</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as MovementReason)}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{MOVEMENT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Restock (+1 & custom) and Remove stock controls. Restock shown for low/out items unless `always`. */
export function StockActions({ item, showRestock = true, compact = false }: { item: Item; showRestock?: boolean; compact?: boolean }) {
  const change = useStockChange();
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {showRestock && (
        <div className="flex">
          <Button size="sm" variant="default" className="h-8 rounded-r-none px-2" onClick={() => change(item, 1, "Purchase")} title="Restock +1">
            <Plus className="h-3.5 w-3.5" />{!compact && <span className="ml-1">Restock</span>}
          </Button>
          <AmountPopover item={item} mode="add">
            <Button size="sm" className="h-8 rounded-l-none border-l border-primary-foreground/20 px-1.5" aria-label="Restock custom amount">
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </AmountPopover>
        </div>
      )}
      <AmountPopover item={item} mode="remove">
        <Button size="sm" variant="outline" className="h-8 px-2" title="Remove stock" disabled={item.quantity <= 0}>
          <Minus className="h-3.5 w-3.5" />{!compact && <span className="ml-1">Remove</span>}
        </Button>
      </AmountPopover>
    </div>
  );
}
