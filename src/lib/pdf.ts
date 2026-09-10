import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY: number } };

/**
 * jsPDF's built-in fonts only cover Latin-1/WinAnsi, which excludes ₹ — it renders as a
 * garbled superscript without an embedded Unicode font. Swap it for a plain-ASCII "Rs." here
 * so every PDF export stays correct without each caller having to know about the limitation.
 */
function toPdfSafeText(value: string): string {
  return value.replace(/₹/g, "Rs. ");
}

function toPdfSafeCell(value: string | number): string | number {
  return typeof value === "string" ? toPdfSafeText(value) : value;
}

export interface PdfSection {
  heading?: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface PdfReport {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
}

export function generatePdfReport({ title, subtitle, sections }: PdfReport): void {
  const doc = new jsPDF() as AutoTableDoc;

  doc.setFontSize(16);
  doc.text(toPdfSafeText(title), 14, 18);

  let cursorY = 26;
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(toPdfSafeText(subtitle), 14, 25);
    cursorY = 32;
  }

  for (const section of sections) {
    if (cursorY > 260) {
      doc.addPage();
      cursorY = 20;
    }
    if (section.heading) {
      doc.setFontSize(12);
      doc.setTextColor(20);
      doc.text(toPdfSafeText(section.heading), 14, cursorY);
      cursorY += 6;
    }
    if (section.rows.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.text("No entries.", 14, cursorY);
      cursorY += 10;
      continue;
    }
    autoTable(doc, {
      startY: cursorY,
      head: [section.columns.map(toPdfSafeText)],
      body: section.rows.map((row) => row.map(toPdfSafeCell)),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [24, 24, 27] },
      margin: { left: 14, right: 14 },
    });
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 10;
  }

  const filename = `${title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
