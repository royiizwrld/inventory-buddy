import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { Item } from "@/lib/types";
import { warrantyStatus } from "@/lib/asset-planning";

export function WarrantyAlerts({ items }: { items: Item[] }) {
  const [today, setToday] = useState("");
  useEffect(() => { const update = () => { const d = new Date(); setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`); }; update(); const timer = setInterval(update, 60000); return () => clearInterval(timer); }, []);
  const alerts = items.filter((i) => { const status = warrantyStatus(i, today); return status === "expiring" || status === "expired"; }).sort((a, b) => (a.warrantyExpiry ?? "").localeCompare(b.warrantyExpiry ?? ""));
  return <section className="mt-6 border-t pt-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5 text-warning" /> Warranty alerts</h2>
    {!alerts.length ? <p className="text-sm text-muted-foreground">No expired warranties or warranties expiring in the next 30 days.</p> : <div className="divide-y">{alerts.map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><Link to="/items/$id" params={{ id: i.id }} className="font-medium hover:underline">{i.name}</Link><p className="text-xs text-muted-foreground">{i.sku} · {i.assignedPerson || "Unassigned"} · {i.location || "No location"}</p></div><p className={`text-sm ${warrantyStatus(i, today) === "expired" ? "text-destructive" : "text-warning-foreground dark:text-warning"}`}>{warrantyStatus(i, today) === "expired" ? "Expired" : "Expires"} {i.warrantyExpiry}</p></div>)}</div>}
  </section>;
}