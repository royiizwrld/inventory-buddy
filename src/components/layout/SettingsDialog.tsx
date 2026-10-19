import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CURRENCIES, DEFAULT_CURRENCY, formatCurrency, getCurrency, setCurrency, subscribeCurrency } from "@/lib/currency";

export const THEMES = [
  { id: "ledger", name: "Ledger", swatch: "bg-theme-ledger" },
  { id: "ocean", name: "Ocean", swatch: "bg-theme-ocean" },
  { id: "rose", name: "Rose", swatch: "bg-theme-rose" },
  { id: "graphite", name: "Graphite", swatch: "bg-theme-graphite" },
  { id: "forest", name: "Forest", swatch: "bg-theme-forest" },
  { id: "amber", name: "Amber", swatch: "bg-theme-amber" },
  { id: "coral", name: "Coral", swatch: "bg-theme-coral" },
  { id: "violet", name: "Violet", swatch: "bg-theme-violet" },
  { id: "cyan", name: "Cyan", swatch: "bg-theme-cyan" },
  { id: "olive", name: "Olive", swatch: "bg-theme-olive" },
] as const;

export function useCurrency() {
  return useSyncExternalStore(subscribeCurrency, getCurrency, () => DEFAULT_CURRENCY);
}

/** Applies stored appearance on load; call once from the shell. */
export function useAppearance() {
  const [theme, setThemeState] = useState("ledger");
  const [dark, setDarkState] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("stockroom:color-theme");
    const t = THEMES.some((x) => x.id === stored) ? stored! : "ledger";
    const m = localStorage.getItem("theme");
    const d = m ? m === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setThemeState(t); setDarkState(d);
    document.documentElement.dataset["theme"] = t;
    document.documentElement.classList.toggle("dark", d);
  }, []);
  const setTheme = (t: string) => { setThemeState(t); document.documentElement.dataset["theme"] = t; localStorage.setItem("stockroom:color-theme", t); };
  const setDark = (d: boolean) => { setDarkState(d); document.documentElement.classList.toggle("dark", d); localStorage.setItem("theme", d ? "dark" : "light"); };
  return { theme, setTheme, dark, setDark };
}

type Appearance = ReturnType<typeof useAppearance>;

export function SettingsDialog({ open, onOpenChange, appearance }: { open: boolean; onOpenChange: (o: boolean) => void; appearance: Appearance }) {
  const currency = useCurrency();
  const { theme, setTheme, dark, setDark } = appearance;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Saved on this device.</DialogDescription>
        </DialogHeader>
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Currency</h3>
          <Select value={currency} onValueChange={(v) => setCurrency(v)}>
            <SelectTrigger aria-label="Currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Example: {formatCurrency(1250.5, currency)}. Prices are shown in this currency, not converted.</p>
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={dark ? "outline" : "default"} onClick={() => setDark(false)}><Sun className="h-4 w-4" />Light</Button>
            <Button variant={dark ? "default" : "outline"} onClick={() => setDark(true)}><Moon className="h-4 w-4" />Dark</Button>
          </div>
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Color theme</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)} aria-pressed={theme === t.id}
                className={`flex items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors hover:bg-muted ${theme === t.id ? "border-primary bg-accent text-accent-foreground" : ""}`}>
                <span className={`h-4 w-4 shrink-0 rounded-full ${t.swatch}`} />
                <span className="flex-1 text-left">{t.name}</span>
                {theme === t.id && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
