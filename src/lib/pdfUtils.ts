import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Reservation } from "@/types";

interface ReservationReportOptions {
  date: string;
  reservations: Reservation[];
  institutionName?: string;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function generateDailyReportPDF({
  date,
  reservations,
  institutionName = "FSSS",
}: ReservationReportOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const formattedDate = formatDate(date);
  const generatedAt = new Date().toLocaleString("pt-BR");

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFillColor(26, 74, 140);
  doc.rect(0, 0, pageWidth, 20, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(institutionName, marginX, 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Sistema de Reservas", marginX, 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Reservas de ${formattedDate}`, pageWidth - marginX, 9, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Emitido em: ${generatedAt}`, pageWidth - marginX, 15, { align: "right" });

  // ── Tabela ─────────────────────────────────────────────────────────────────
  if (reservations.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(130, 140, 160);
    doc.text("Nenhuma reserva registrada para esta data.", pageWidth / 2, 40, { align: "center" });
  } else {
    const tableRows = reservations.map((r) => [
      r.itemName,
      r.slots.join("\n"),
      r.userName ?? r.userEmail ?? "—",
      r.quantity != null ? String(r.quantity) : "—",
    ]);

    autoTable(doc, {
      startY: 26,
      head: [["Item Reservado", "Horários", "Responsável", "Qtd."]],
      body: tableRows,
      margin: { left: marginX, right: marginX },
      headStyles: {
        fillColor: [26, 74, 140],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [30, 45, 65],
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      alternateRowStyles: {
        fillColor: [246, 249, 253],
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 55 },
        3: { cellWidth: 18, halign: "center" },
      },
      tableLineColor: [215, 223, 232],
      tableLineWidth: 0.2,
    });
  }

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(215, 223, 232);
  doc.setLineWidth(0.3);
  doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);
  doc.setTextColor(160, 170, 185);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `${institutionName} — documento gerado automaticamente`,
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  doc.save(`reservas_${date}.pdf`);
}
