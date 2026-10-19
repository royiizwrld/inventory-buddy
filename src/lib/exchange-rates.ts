/** Live exchange rates (open.er-api.com, no key), cached per base currency for 24h on this device. */
export type Rates = { base: string; fetchedAt: number; rates: Record<string, number> };
const DAY = 86_400_000;
const key = (base: string) => `stockroom:fx:${base}`;

/** Converts an amount paid in `from` into `base` using rates quoted as 1 base = rates[x]. */
export function convertToBase(amount: number, from: string, rates: Rates): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (from === rates.base) return amount;
  const r = rates.rates[from];
  if (!r || !Number.isFinite(r) || r <= 0) return null;
  return Math.round((amount / r) * 100) / 100;
}

/** How many units of base one unit of `from` is worth. */
export function rateToBase(from: string, rates: Rates) {
  const r = rates.rates[from];
  return r ? 1 / r : null;
}

export async function getRates(base: string): Promise<Rates> {
  let cached: Rates | null = null;
  try { cached = JSON.parse(localStorage.getItem(key(base)) ?? "null"); } catch { cached = null; }
  if (cached && Date.now() - cached.fetchedAt < DAY) return cached;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
    const j = await res.json();
    if (j?.result !== "success" || typeof j.rates !== "object") throw new Error("bad rates");
    const fresh: Rates = { base, fetchedAt: Date.now(), rates: j.rates };
    localStorage.setItem(key(base), JSON.stringify(fresh));
    return fresh;
  } catch (e) {
    if (cached) return cached; // stale but usable offline
    throw e;
  }
}
