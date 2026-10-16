import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { friendlyAiError, responseText } from "./ai-text";

const InputSchema = z.object({
  text: z.string().max(60000).optional(),
  imageDataUrl: z.string().max(12_000_000).optional(),
  categories: z.array(z.string()).max(100),
  locations: z.array(z.string()).max(200),
});

const RowSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().catch(1),
  unitPrice: z.coerce.number().catch(0),
  category: z.string().catch("Other"),
  location: z.string().catch(""),
  sku: z.string().catch(""),
  itemType: z.enum(["inventory", "asset"]).catch("inventory"),
  confidence: z.coerce.number().min(0).max(1).catch(0.5),
  qrCode: z.string().catch(""),
});
export type ExtractedRow = z.infer<typeof RowSchema>;

export const extractItems = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; items: ExtractedRow[] } | { ok: false; error: string }> => {
    if (!data.text?.trim() && !data.imageDataUrl) return { ok: false, error: "Please paste some text or upload a file first." };
    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    const instructions = `You extract inventory items from messy text, invoices, delivery notes or shelf lists.
Return ONLY a JSON object: {"items":[{"name":string,"quantity":number,"unitPrice":number,"category":string,"location":string,"sku":string,"qrCode":string,"itemType":"inventory"|"asset","confidence":number}]}
Rules:
- category must be one of: ${data.categories.join(", ")}. Use "Other" if unsure.
- location: prefer one of: ${data.locations.join(", ")}; otherwise use the text as written, or "".
- unitPrice is the price per unit. If a total is clearly given, divide by quantity. Use 0 if unknown.
- quantity defaults to 1 if not stated.
- itemType "asset" for individually tracked equipment (laptops, machines, items with asset tags); else "inventory".
- Put asset tags (e.g. LT-014) in qrCode; put explicit SKUs/product codes in sku.
- confidence 0..1: lower it when you guessed quantity, price, or name.
- Never invent items that are not in the input.`;
    const content: Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "auto" }> = [];
    if (data.text?.trim()) content.push({ type: "input_text", text: data.text });
    if (data.imageDataUrl) content.push({ type: "input_image", image_url: data.imageDataUrl, detail: "auto" });
    if (!data.text?.trim()) content.push({ type: "input_text", text: "Extract the items from this image." });
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions,
        input: [{ role: "user", content }],
        text: { format: { type: "json_object" } },
      });
      const raw = responseText(res);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim());
      } catch {
        return { ok: false, error: "The AI returned something we couldn't read. Try simplifying the text or try again." };
      }
      const list = (parsed as { items?: unknown[] })?.items;
      if (!Array.isArray(list)) return { ok: false, error: "The AI didn't find any items in that input." };
      const items = list.map((r) => RowSchema.safeParse(r)).filter((r) => r.success).map((r) => r.data);
      if (!items.length) return { ok: false, error: "No items could be recognised. Try adding quantities and names." };
      return { ok: true, items };
    } catch (e) {
      console.error("extractItems failed", e);
      return { ok: false, error: friendlyAiError(e) };
    }
  });
