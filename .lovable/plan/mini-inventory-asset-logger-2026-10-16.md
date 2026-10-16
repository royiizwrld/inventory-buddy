# Mini Inventory & Asset Logger

## What you'll get
- **Dashboard**: summary cards (items, units, value, low/out of stock), Low Stock Alerts with Restock (+1 and custom amount dropdown, undo toast), value-by-category chart.
- **Items page**: search (name, SKU, location, barcode, QR/asset tag), filter by category/status, sortable columns, no-results state, clear filters, color status badges, Restock and Remove stock actions, Export CSV (current filtered view), CSV Import with validation preview and duplicate-SKU flags.
- **Add/Edit item** side form: name, unique SKU, category, quantity, unit price, location, reorder level (default 5), notes, item type, barcode, QR/asset tag. Validation, toasts, delete confirmation. Add custom categories/locations inline.
- **Item detail page**: all fields, barcode/QR preview box (generated image), movement history, quantity-over-time chart. Scanner input is built so a camera scanner can plug in later.
- **Stock movement history**: every quantity change logged with date, amount, resulting quantity, reason (Purchase, Sale, Damaged, Lost, Correction, Other).
- **Smart Bulk Entry**: paste text or upload CSV/PDF/photo, AI extracts items into an editable preview, low-confidence rows highlighted, match to existing items ("Add as new" / "Add quantity to existing"), saved only on "Confirm & Save".
- **AI Assistant**: floating button on every page, side panel chat with streaming, markdown, starter questions, typing indicator, Clear chat, and confirm-before-apply quick actions (restock, update reorder levels).
- Light/dark mode, mobile-friendly layout, sample data seeded on first visit with "Clear sample data".

## Design direction
Calm "warehouse ledger" look: warm neutral background, deep teal primary, amber for low stock, red for out of stock, Space Grotesk headings + DM Sans body.

## Technical details
- Data in localStorage via one `InventoryProvider` context (items, categories, locations, movements) plus pure `getStatus` logic in `lib/inventory.ts` with unit tests.
- Routes: `/` dashboard, `/items`, `/items/$id`, `/bulk`.
- Lovable Cloud enabled; AI calls run server-side (server functions / streaming server route) using the Lovable AI Gateway SDK, so no key reaches the browser. Rate-limit and credit errors shown as friendly toasts; invalid AI JSON handled with a clear error.
- Assistant receives a compact computed summary (counts, value by category/location, low/out items, recent movements with usage rate, slow movers, missing data, duplicate-looking names) and is instructed to use only that data.
- Libraries: recharts (charts), jsbarcode + qrcode (previews), papaparse (CSV), react-markdown, pdf text extraction in browser; photos sent as images to the AI.
