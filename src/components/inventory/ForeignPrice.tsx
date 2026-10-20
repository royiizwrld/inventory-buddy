import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, formatCurrency, getCurrency } from "@/lib/currency";
import { convertToBase, getRates, rateToBase } from "@/lib/exchange-rates";

/** Lets the user enter a price paid in another currency and converts it to the app currency at today's rate. */
export function ForeignPrice({ onConvert }: { onConvert: (amount: number) => void }) {
  const base = getCurrency();
  const [from, setFrom] = useState<string>(CURRENCIES.find((c) => c.code !== base)?.code ?? "USD");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const run = async () => {
    const n = Number(amount);
    if (!amount || !Number.isFinite(n) || n < 0) { toast.error("Enter the amount you paid"); return; }
    setBusy(true);
    try {
      const rates = await getRates(base);
      const v = convertToBase(n, from, rates);
      if (v === null) { toast.error(`No rate available for ${from}`); return; }
      onConvert(v);
      setNote(`1 ${from} = ${formatCurrency(rateToBase(from, rates) ?? 0, base)} · rate from ${new Date(rates.fetchedAt).toLocaleDateString()}`);
    } catch { toast.error("Couldn't get exchange rates. Check your connection."); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor="paid-amount">Paid in another currency?</Label>
      <div className="flex gap-1.5">
        <Select value={from} onValueChange={setFrom}>
          <SelectTrigger className="w-24" aria-label="Paid currency"><SelectValue /></SelectTrigger>
          <SelectContent>{CURRENCIES.filter((c) => c.code !== base).map((c) => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
        </Select>
        <Input id="paid-amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        <Button type="button" variant="outline" size="sm" className="h-9" disabled={busy} onClick={run}>{busy ? "…" : "Convert"}</Button>
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
