import { getCurrency } from "./currency";
import type { Item } from "./types";
import { labelCode, orderTotals, reorderLines, type OrderLine, type ReorderOverrides } from "./asset-planning";

export async function labelsPdf(items: Item[]) {
  const [{ jsPDF }, QR] = await Promise.all([import("jspdf"), import("qrcode")]);
  const doc = new jsPDF();
  for (let n = 0; n < items.length; n++) {
    const item = items[n];
    if (!item) continue;
    if (n > 0 && n % 14 === 0) doc.addPage();
    const slot = n % 14, x = 10 + (slot % 2) * 96, y = 10 + Math.floor(slot / 2) * 39;
    doc.rect(x, y, 92, 35);
    const url = await QR.toDataURL(labelCode(item), { width: 256, margin: 2 });
    doc.addImage(url, "PNG", x + 2, y + 2, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(doc.splitTextToSize(item.name, 54).slice(0, 2), x + 35, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(`SKU: ${item.sku}`, 54).slice(0, 2), x + 35, y + 18);
    doc.text(doc.splitTextToSize(`Location: ${item.location || "—"}`, 54).slice(0, 2), x + 35, y + 27);
  }
  return doc;
}

export async function reorderPdf(items: Item[], overrides?: ReorderOverrides) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text("Stockroom — Reorder list", 14, 18);
  doc.setFontSize(10);
  doc.text(`Created ${new Date().toLocaleDateString()}`, 14, 26);
  autoTable(doc, { startY: 32, head: [["Name", "SKU", "Location", "Current", "Level", "Order", `Unit price (${getCurrency()})`, `Est. cost (${getCurrency()})`]],
    body: reorderLines(items, overrides).map(({ item: i, qty }) => [i.name, i.sku, i.location, i.quantity, i.reorderLevel, qty, i.unitPrice.toFixed(2), (qty * i.unitPrice).toFixed(2)]), styles: { fontSize: 9 }, theme: "grid" });
  return doc;
}

export async function inventoryPdf(items: Item[]) {
  const [{ jsPDF }, { default: autoTable }, { getStatus, STATUS_LABEL, itemValue }] = await Promise.all([import("jspdf"), import("jspdf-autotable"), import("./inventory")]);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text("Stockroom — Inventory list", 14, 18);
  doc.setFontSize(10);
  doc.text(`Created ${new Date().toLocaleDateString()} · ${items.length} items`, 14, 26);
  autoTable(doc, { startY: 32, head: [["Name", "SKU", "Category", "Qty", `Unit price (${getCurrency()})`, `Value (${getCurrency()})`, "Location", "Status"]],
    body: items.map((i) => [i.name, i.sku, i.category, i.quantity, i.unitPrice.toFixed(2), itemValue(i).toFixed(2), i.location || "—", STATUS_LABEL[getStatus(i)]]), styles: { fontSize: 9 }, theme: "grid" });
  return doc;
}

/** Opens the PDF in a new tab with the print dialog. */
export function printPdf(doc: { autoPrint: () => unknown; output: (type: "bloburl") => URL | string }) {
  doc.autoPrint();
  const w = window.open(String(doc.output("bloburl")), "_blank");
  if (!w) throw new Error("popup blocked");
}

export type SupplierInfo = { company: string; supplier: string; email: string; poNumber: string; deliveryDate: string; terms: string; notes: string };

export async function purchaseOrderPdf(info: SupplierInfo, lines: OrderLine[], taxPercent: number, shipping: number) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const cur = getCurrency();
  const money = (n: number) => `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const t = orderTotals(lines, taxPercent, shipping);
  const doc = new jsPDF();
  doc.setFontSize(20); doc.setFont("helvetica", "bold");
  doc.text("PURCHASE ORDER", 14, 20);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(info.company || "Stockroom", 14, 28);
  doc.text([`PO number: ${info.poNumber}`, `Date: ${new Date().toLocaleDateString()}`, ...(info.deliveryDate ? [`Deliver by: ${info.deliveryDate}`] : []), ...(info.terms ? [`Terms: ${info.terms}`] : [])], 196, 20, { align: "right" });
  doc.setFont("helvetica", "bold"); doc.text("Supplier", 14, 46); doc.setFont("helvetica", "normal");
  doc.text([info.supplier || "—", ...(info.email ? [info.email] : [])], 14, 52);
  autoTable(doc, { startY: 64, head: [["Item", "SKU", "Qty", `Unit cost (${cur})`, `Amount (${cur})`]],
    body: lines.map((l) => [l.name, l.sku, l.qty, l.unitCost.toFixed(2), (l.qty * l.unitCost).toFixed(2)]),
    foot: [["", "", "", "Subtotal", money(t.subtotal)], ["", "", "", `Tax (${taxPercent}%)`, money(t.tax)], ["", "", "", "Shipping", money(t.shipping)], ["", "", "", "Total", money(t.total)]],
    styles: { fontSize: 10 }, theme: "grid" });
  if (info.notes) {
    const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
    doc.setFontSize(10); doc.text(doc.splitTextToSize(`Notes: ${info.notes}`, 180), 14, y + 10);
  }
  return doc;
}
