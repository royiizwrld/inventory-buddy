import type { Item } from "./types";
import { labelCode, reorderItems, suggestedReorder } from "./asset-planning";

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

export async function reorderPdf(items: Item[]) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text("Stockroom — Reorder list", 14, 18);
  doc.setFontSize(10);
  doc.text(`Created ${new Date().toLocaleDateString()} · Target: twice reorder level (minimum 1 unit)`, 14, 26);
  autoTable(doc, { startY: 32, head: [["Name", "SKU", "Location", "Current", "Level", "Order", "Unit price", "Est. cost"]],
    body: reorderItems(items).map((i) => [i.name, i.sku, i.location, i.quantity, i.reorderLevel, suggestedReorder(i), i.unitPrice.toFixed(2), (suggestedReorder(i) * i.unitPrice).toFixed(2)]), styles: { fontSize: 9 }, theme: "grid" });
  return doc;
}

export async function inventoryPdf(items: Item[]) {
  const [{ jsPDF }, { default: autoTable }, { getStatus, STATUS_LABEL, itemValue }] = await Promise.all([import("jspdf"), import("jspdf-autotable"), import("./inventory")]);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text("Stockroom — Inventory list", 14, 18);
  doc.setFontSize(10);
  doc.text(`Created ${new Date().toLocaleDateString()} · ${items.length} items`, 14, 26);
  autoTable(doc, { startY: 32, head: [["Name", "SKU", "Category", "Qty", "Unit price", "Value", "Location", "Status"]],
    body: items.map((i) => [i.name, i.sku, i.category, i.quantity, i.unitPrice.toFixed(2), itemValue(i).toFixed(2), i.location || "—", STATUS_LABEL[getStatus(i)]]), styles: { fontSize: 9 }, theme: "grid" });
  return doc;
}

/** Opens the PDF in a new tab with the print dialog. */
export function printPdf(doc: { autoPrint: () => unknown; output: (type: "bloburl") => URL | string }) {
  doc.autoPrint();
  const w = window.open(String(doc.output("bloburl")), "_blank");
  if (!w) throw new Error("popup blocked");
}