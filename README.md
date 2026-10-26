# Inventory Buddy

Develop a responsive Mini Inventory & Asset Logger web app with a clean, professional dashboard design (card layout, light/dark mode, works well on mobile and desktop).

DASHBOARD

- Summary cards: Total Items (count of distinct items), Total Units in stock, Total Inventory Value (sum of quantity x unit price), and number of Low Stock / Out of Stock items.

- A "Low Stock Alerts" panel listing items at or below their reorder level, with the quantity and a quick Restock button.

- A chart of inventory value by category.

ITEMS TABLE

- Searchable table with real-time filtering: search by name, SKU or location; filter by category and by status (In Stock, Low Stock, Out of Stock). Sortable columns. Show a "no results" state and a clear-filters button.

- Status is calculated automatically: Out of Stock when quantity is 0, Low Stock when quantity is at or below the item's reorder level, otherwise In Stock. Show color-coded status badges.

CRUD

- Add, edit and delete items in a modal or side form with fields: name, SKU (must be unique, validate it), category, quantity, unit price, location, reorder level (default 5), notes, and an optional item type (Inventory item / Fixed asset).

- Delete with a confirmation dialog. Validate inputs (no negative quantities or prices) and show toast confirmations.

- Default categories (e.g. Electronics, Office Supplies, Furniture, Tools, Other), and let users add custom categories and locations.

DATA

- Persist everything in localStorage (items, categories, locations).

- Seed with a small set of sample items on first load, with a "Clear sample data" button.

Organize the code with separate components, shared types, and one data context/hook for storage and the status logic.                                                                                                                                                                                                                                                                                               Add a quick "Restock" button next to low-stock and out-of-stock items in both the table and the alerts panel. A single click increments quantity by 1, and a small dropdown beside it lets the user restock by a custom amount (e.g. +5, +10, or any number). Show a toast with an undo option.

Add barcode and QR code placeholder fields on each item: a "Barcode" text field and a "QR code / asset tag" text field, both optional, shown on the item detail view and searchable from the main search box. Show a placeholder box on the item detail page labeled "Barcode / QR preview" that renders the barcode value as a generated barcode image or QR code when a value is entered. Make sure the structure can support real camera scanning later.                                                                                                                                                                                                                                                                                                                Add a stock movement history. Every change to quantity (manual edit, restock, stock removal, bulk import) is recorded with the date, item, amount changed, resulting quantity, and an optional reason (Purchase, Sale, Damaged, Lost, Correction, Other). Add a "Remove stock" action next to Restock, and an item detail page with its movement history and a small quantity-over-time chart.

Add an Export CSV button that downloads the currently filtered items, and a CSV import with a preview step that validates rows and flags duplicate SKUs before saving.                                                                                                                                                                                                  Add a "Smart Bulk Entry" feature. The user can paste messy text or upload a CSV, a PDF, or a photo of an invoice, delivery note or shelf list, for example:

"20 A4 paper reams @ 650 shelf B2, 5 office chairs 8500 each store room, HDMI cables x30 - 400, laptop Dell Latitude asset tag LT-014 45000"

Send it to the AI through an edge function and have it return structured JSON: a list of items with name, quantity, unit price, category (mapped to existing categories where possible), location, SKU if present, and item type. Show an editable preview table where each row can be corrected or deleted. Highlight low-confidence rows, and match likely existing items by name or SKU so the user can choose to "Add as new" or "Add quantity to existing item". Nothing is saved until the user clicks "Confirm & Save". Handle invalid AI output with a friendly error.                                                                                                                                                                                                                                                                                                        Add an AI inventory assistant as a floating chat button that opens a side panel on every page.

BEHAVIOR

- The assistant answers questions about the user's inventory like "What should I reorder this week?", "Which items are tying up the most money?", "What's out of stock?", "Which items haven't moved in 60 days?", "How much is stored in each location?", "Summarize my inventory in a few lines."

- On each message, send the AI a compact summary of the data: item counts, value by category and location, low and out-of-stock items with their reorder levels, recent stock movements (including usage rate), and slow-moving items.

- It identifies and explains issues: items likely to run out soon based on recent usage, overstocked items, items with unusual quantity changes, duplicate-looking entries, and missing data such as no price or location. It suggests reorder quantities and explains its reasoning using the data.

- It can draft a reorder list or a supplier message the user can copy.

- It only uses the data provided, never invents numbers, and says so when there isn't enough history to make a prediction. Answers are concise and practical.

- Include starter questions, markdown rendering, streaming responses, a "Clear chat" button and a typing indicator.

- Add quick actions such as "Restock these items" or "Update reorder levels", applied only after the user confirms.

IMPLEMENTATION

- Use Lovable Cloud with an edge function to call the AI model so no API key is exposed in the browser. Handle errors and rate limits gracefully.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a639243-c046-44fd-bba5-d224170f06be).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
