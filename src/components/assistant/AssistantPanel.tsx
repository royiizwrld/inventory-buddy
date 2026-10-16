import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Copy, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useInventory } from "@/context/InventoryContext";
import { buildSummary } from "@/lib/inventory";

type Msg = { role: "user" | "assistant"; content: string };
type Action = { type: "restock"; sku: string; amount: number } | { type: "set_reorder"; sku: string; level: number };

const STARTERS = [
  "What should I reorder this week?",
  "Which items are tying up the most money?",
  "What's out of stock?",
  "Which items haven't moved in 60 days?",
  "How much is stored in each location?",
  "Summarize my inventory in a few lines.",
  "Draft a supplier message for low-stock items.",
];

function splitActions(text: string): { body: string; actions: Action[] } {
  const m = text.match(/```actions\s*([\s\S]*?)```/);
  if (!m) return { body: text.replace(/```actions[\s\S]*$/, ""), actions: [] };
  try {
    const arr = JSON.parse(m[1] ?? "[]");
    return { body: text.replace(m[0], "").trim(), actions: Array.isArray(arr) ? arr : [] };
  } catch {
    return { body: text.replace(m[0], "").trim(), actions: [] };
  }
}

export function AssistantPanel() {
  const inv = useInventory();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Action[] | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-20), summary: buildSummary(inv.items, inv.movements) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "The assistant is unavailable right now.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") {
              acc += ev.delta;
              setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
            } else if (ev.type === "error" || ev.type === "response.failed" || ev.error) {
              throw new Error("The assistant hit an error. Please try again.");
            }
          } catch (e) {
            if (e instanceof Error && e.message.startsWith("The assistant")) throw e;
          }
        }
      }
      if (!acc) throw new Error("The assistant didn't return an answer. Please try again.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const msg = (e as Error).message || "Something went wrong.";
      toast.error(msg);
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc || `_${msg}_` }]);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const apply = (actions: Action[]) => {
    let n = 0;
    for (const a of actions) {
      const item = inv.items.find((i) => i.sku.toLowerCase() === String(a.sku).toLowerCase());
      if (!item) continue;
      if (a.type === "restock" && a.amount > 0) { inv.adjustStock(item.id, Math.floor(a.amount), { reason: "Purchase", source: "assistant" }); n++; }
      if (a.type === "set_reorder" && a.level >= 0) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = item;
        inv.updateItem(item.id, { ...rest, reorderLevel: Math.floor(a.level) });
        n++;
      }
    }
    toast.success(`Applied ${n} change${n === 1 ? "" : "s"}`);
    setPending(null);
  };

  const itemName = (sku: string) => inv.items.find((i) => i.sku.toLowerCase() === sku.toLowerCase())?.name ?? sku;

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" className="fixed bottom-5 right-5 z-40 h-14 rounded-full px-5 shadow-lg" aria-label="Open inventory assistant">
        <Sparkles className="h-5 w-5" /> <span className="ml-1 hidden sm:inline">Ask AI</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between pr-8">
              <SheetTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Inventory assistant</SheetTitle>
              <Button variant="ghost" size="sm" onClick={() => { abortRef.current?.abort(); setMsgs([]); }} disabled={!msgs.length}>
                <Trash2 className="h-4 w-4" /> Clear chat
              </Button>
            </div>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!msgs.length && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ask about your stock. Answers use only your saved data.</p>
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="block w-full rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-accent">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => {
              if (m.role === "user") return <div key={i} className="ml-8 rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">{m.content}</div>;
              if (!m.content && busy) return (
                <div key={i} className="flex w-16 gap-1 rounded-2xl bg-muted px-3 py-3" aria-label="Assistant is typing">
                  {[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 150}ms` }} />)}
                </div>
              );
              const { body, actions } = splitActions(m.content);
              return (
                <div key={i} className="group mr-4 rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                  <div className="prose-chat"><ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown></div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {actions.length > 0 && !(busy && i === msgs.length - 1) && (
                      <Button size="sm" onClick={() => setPending(actions)}>
                        {actions.every((a) => a.type === "restock") ? "Restock these items" : actions.every((a) => a.type === "set_reorder") ? "Update reorder levels" : "Apply suggested changes"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 opacity-60 group-hover:opacity-100" onClick={() => { navigator.clipboard.writeText(body); toast.success("Copied"); }}>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder="Ask about your inventory…" className="min-h-10 resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
          </form>
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply these changes?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {pending?.map((a, i) => (
                  <li key={i}>{a.type === "restock" ? `Restock ${itemName(a.sku)} by +${a.amount}` : `Set reorder level of ${itemName(a.sku)} to ${a.level}`}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pending && apply(pending)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
