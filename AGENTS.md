<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All inventory data lives in localStorage via `src/context/InventoryContext.tsx`; status/summary logic is pure in `src/lib/inventory.ts` — keeps storage swappable and logic testable.
- AI calls run only server-side: extraction in `src/lib/ai.functions.ts` (server fn), streaming chat in `src/routes/api/chat.ts` — keeps the key out of the browser.
- Assistant suggested changes come as a fenced `actions` JSON block and are applied only after user confirmation.
