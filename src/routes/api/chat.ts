import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { friendlyAiError } from "@/lib/ai-text";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000) })).max(40),
  summary: z.unknown(),
});

const SYSTEM = `You are an inventory assistant for a small business. You receive a JSON DATA summary of the user's inventory.
Rules:
- Use ONLY the numbers in DATA. Never invent figures. If history is too short (see historyDays, used30d, daysUntilOut null), say there isn't enough history to predict.
- Be concise and practical. Use markdown: short bullets, small tables when useful.
- Explain reasoning briefly with the data (e.g. "used 17 in 30 days, ~0.6/day, 3 left -> ~5 days").
- Look for: items likely to run out soon, overstocked items, unusual quantity changes, duplicate-looking entries, missing price/location.
- When suggesting reorder quantities, aim to cover ~30 days of usage plus the reorder level, and say so.
- You can draft reorder lists or supplier messages in a code block so the user can copy them.
- When you propose concrete changes, append ONE fenced block at the end, exactly:
\`\`\`actions
[{"type":"restock","sku":"SKU","amount":10},{"type":"set_reorder","sku":"SKU","level":8}]
\`\`\`
Only use SKUs present in DATA for restock/set_reorder. The app asks the user to confirm before applying.
- When the user tells you about NEW items (e.g. "I received 10 chairs at $120"), add create_item actions:
{"type":"create_item","name":"Ergonomic Chair","quantity":10,"unitPrice":120,"category":"Furniture","location":"","sku":"","itemType":"inventory"}
Use only details the user gave; leave sku/location "" if unknown (the app generates a SKU). If the item already exists in DATA, use restock instead.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        try {
          const { streamResponse } = await import("@lovable.dev/ai-gateway");
          const stream = await streamResponse({
            model: "openai/gpt-6-astra",
            instructions: `${SYSTEM}\n\nDATA:\n${JSON.stringify(body.summary)}`,
            input: body.messages.map((m) => ({ role: m.role, content: m.content })),
          });
          return stream.toResponse();
        } catch (e) {
          console.error("chat failed", e);
          const status = (e as { httpStatus?: number }).httpStatus;
          return Response.json({ error: friendlyAiError(e) }, { status: status === 429 || status === 402 ? status : 500 });
        }
      },
    },
  },
});
