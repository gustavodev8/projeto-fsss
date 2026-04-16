import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Reservation } from "@/data/mockData";

interface ReservationReportOptions {
  date: string;         // "YYYY-MM-DD"
  reservations: Reservation[];
  institutionName?: string;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatSlots(slots: string[]): string {
  return slots.join("  |  ");
}

export function generateDailyReportPDF({
  date,
  reservations,
  institutionName = "FSSS",
}: ReservationReportOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const formattedDate = formatDate(date);
  const generatedAt = new Date().toLocaleString("pt-BR");

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  // Barra azul institucional no topo
  doc.setFillColor(26, 74, 140); // #1a4a8c (azul naval)
  doc.rect(0, 0, pageWidth, 22, "F");

  // Nome da instituição
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(institutionName, marginX, 10);

  // Subtítulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Sistema de Reserva de Espaços e Equipamentos", marginX, 16);

  // Data do relatório (direita)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Relatório do dia ${formattedDate}`, pageWidth - marginX, 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Emitido em: ${generatedAt}`, pageWidth - marginX, 16, { align: "right" });

  // ── Linha divisória ────────────────────────────────────────────────────────
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.line(marginX, 26, pageWidth - marginX, 26);

  // ── Estatísticas rápidas ───────────────────────────────────────────────────
  const totalReservations = reservations.length;
  const uniqueProfessors = new Set(reservations.map((r) => r.userEmail)).size;
  const spacesCount = reservations.filter((r) => r.category === "espacos").length;
  const equipsCount = reservations.filter((r) => r.category === "instrumentos").length;

  doc.setTextColor(50, 70, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  const statsY = 32;
  doc.text(`Total de reservas: ${totalReservations}`, marginX, statsY);
  doc.text(`Professores: ${uniqueProfessors}`, marginX + 55, statsY);
  doc.text(`Espaços: ${spacesCount}`, marginX + 110, statsY);
  doc.text(`Equipamentos: ${equipsCount}`, marginX + 155, statsY);

  // ── Tabela ─────────────────────────────────────────────────────────────────
  if (reservations.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(130, 140, 160);
    doc.text("Nenhuma reserva registrada para esta data.", pageWidth / 2, 55, { align: "center" });
  } else {
    const tableRows = reservations.map((r) => [
      r.userName ?? r.userEmail ?? "—",
      r.itemName,
      r.category === "espacos" ? "Espaço" : "Equipamento",
      formatSlots(r.slots),
      r.quantity != null ? String(r.quantity) : "—",
      r.groupId ? "Agrupado" : "Individual",
    ]);

    autoTable(doc, {
      startY: 38,
      head: [["Professor / Responsável", "Item Reservado", "Tipo", "Horários", "Qtd.", "Tipo de Reserva"]],
      body: tableRows,
      margin: { left: marginX, right: marginX },
      headStyles: {
        fillColor: [26, 74, 140],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "left",
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 55, 75],
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      },
      alternateRowStyles: {
        fillColor: [245, 248, 252],
      },
      columnStyles: {
        0: { cellWidth: 52 },
        1: { cellWidth: 52 },
        2: { cellWidth: 28 },
        3: { cellWidth: "auto" },
        4: { cellWidth: 16, halign: "center" },
        5: { cellWidth: 28, halign: "center" },
      },
      tableLineColor: [210, 220, 230],
      tableLineWidth: 0.2,
    });
  }

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 210, 220);
  doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);
  doc.setTextColor(150, 160, 175);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `${institutionName} — Sistema de Reservas  |  Documento gerado automaticamente`,
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  // ── Salvar ─────────────────────────────────────────────────────────────────
  const fileName = `reservas_${date}.pdf`;
  doc.save(fileName);
}
