import React, { useState, useMemo, useRef, useEffect } from "react";
import { WeeklyDetailModal } from "@/components/WeeklyDetailModal";
import { useQuery } from "@tanstack/react-query";
import { useReservations } from "@/contexts/ReservationContext";
import { generateDailyReportPDF } from "@/lib/pdfUtils";
import { listProfessors } from "@/services/users";
import { fetchCancelledReservations } from "@/services/reservations";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarBlank,
  DownloadSimple,
  Users,
  BookOpen,
  FileText,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  MagnifyingGlass,
  FileCsv,
  X,
  Trash,
  Warning,
  Info,
  IdentificationCard,
  Hash,
} from "@phosphor-icons/react";

const HIST_PAGE_SIZE = 10;

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function isoToday() {
  return format(new Date(), "yyyy-MM-dd");
}

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return format(date, "yyyy-MM-dd");
}

function weekRange(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(y, m - 1, diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: format(mon, "yyyy-MM-dd"),
    end: format(sun, "yyyy-MM-dd"),
  };
}

function downloadCSV(data: Reservation[], filename: string) {
  const headers = ["Data", "Professor", "Email", "Item", "Tipo", "Horários", "Qtd.", "Status"];
  const rows = data.map((r) => [
    formatDateDisplay(r.date),
    r.userName ?? "",
    r.userEmail ?? "",
    r.itemName,
    r.category === "espacos" ? "Espaço" : "Equipamento",
    r.slots.join("; "),
    r.quantity ?? 1,
    r.cancelledAt ? "Cancelada" : "Confirmada",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TypeBadge = ({ category }: { category: string }) => (
  <span className={`inline-flex items-center text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20`}>
    {category === "espacos" ? "Espaço" : "Equipamento"}
  </span>
);

const StatusBadge = ({ cancelled }: { cancelled: boolean }) => (
  <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
    cancelled
      ? "bg-rose-50 text-rose-600 border border-rose-100"
      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
  }`}>
    {cancelled ? "Cancelada" : "Confirmada"}
  </span>
);

const StatCard = ({
  icon, label, value, sub, iconBg = "bg-gray-100", onClick,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; iconBg?: string; onClick?: () => void;
}) => (
  <div
    className={`bg-white border border-border rounded-xl p-6 hover:shadow-md transition-all duration-200 flex flex-col items-start${onClick ? " cursor-pointer select-none" : ""}`}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
  >
    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4 shadow-sm border border-primary/5`}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
    </div>
    <div className="space-y-1">
      <p className="text-3xl font-extrabold text-foreground tracking-tight leading-none">{value}</p>
      <p className="text-base font-bold text-foreground leading-tight">{label}</p>
      {sub && <p className="text-sm font-medium text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { reservations, cancelReservation, cancelGroup, reload } = useReservations();
  const sessionToday = useRef(isoToday()).current;

  const [selectedDate, setSelectedDate] = useState(sessionToday);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pedidos" | "historico">("pedidos");
  const [histSearch, setHistSearch] = useState("");
  const [histCategory, setHistCategory] = useState<"all" | "espacos" | "instrumentos">("all");
  const [histStatus, setHistStatus] = useState<"confirmada" | "cancelada" | "todas">("confirmada");
  const [histPage, setHistPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [selectedResForDetails, setSelectedResForDetails] = useState<Reservation | null>(null);

  const { data: professors = [] } = useQuery({
    queryKey: ["professors"],
    queryFn: listProfessors,
  });

  const { data: cancelledReservations = [] } = useQuery({
    queryKey: ["cancelledReservations"],
    queryFn: () => fetchCancelledReservations(),
    enabled: activeTab === "historico" && (histStatus === "cancelada" || histStatus === "todas"),
  });

  const today = isoToday();
  const { start: weekStart, end: weekEnd } = weekRange(today);

  const stats = useMemo(() => ({
    today: reservations.filter((r) => r.date === today).length,
    week: reservations.filter((r) => r.date >= weekStart && r.date <= weekEnd).length,
    total: reservations.length,
    professors: professors.length,
  }), [reservations, today, weekStart, weekEnd, professors]);

  const dayReservations = useMemo(
    () => reservations.filter((r) => r.date === selectedDate),
    [reservations, selectedDate]
  );

  const histSource = useMemo(() => {
    if (histStatus === "confirmada") return reservations;
    if (histStatus === "cancelada") return cancelledReservations;
    return [...reservations, ...cancelledReservations].sort((a, b) => b.date.localeCompare(a.date));
  }, [histStatus, reservations, cancelledReservations]);

  const histFiltered = useMemo(() => {
    return [...histSource]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((r) => {
        const matchCat = histCategory === "all" || r.category === histCategory;
        const q = histSearch.toLowerCase();
        const matchSearch = !q ||
          (r.userName ?? "").toLowerCase().includes(q) ||
          (r.userEmail ?? "").toLowerCase().includes(q) ||
          r.itemName.toLowerCase().includes(q);
        return matchCat && matchSearch;
      });
  }, [histSource, histSearch, histCategory]);

  useEffect(() => {
    setHistPage(1);
  }, [histSearch, histCategory, histStatus]);

  const histTotalPages = Math.ceil(histFiltered.length / HIST_PAGE_SIZE);
  const histPaged = useMemo(
    () => histFiltered.slice((histPage - 1) * HIST_PAGE_SIZE, histPage * HIST_PAGE_SIZE),
    [histFiltered, histPage]
  );

  const displayedDateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [selectedDate]);

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      generateDailyReportPDF({ date: selectedDate, reservations: dayReservations, institutionName: "FSSS" });
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handleExportCSV = () => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    downloadCSV(histFiltered, `reservas-fsss-${dateStr}.csv`);
  };

  const handleCancel = async (r: Reservation) => {
    const nome = r.userName ?? r.userEmail ?? "professor";
    const msg = r.groupId
      ? `Cancelar todas as reservas do grupo de ${nome} em ${formatDateDisplay(r.date)}?`
      : `Cancelar a reserva de "${r.itemName}" de ${nome} em ${formatDateDisplay(r.date)}?`;
    if (!confirm(msg)) return;
    setCancellingId(r.id);
    if (r.groupId) {
      await cancelGroup(r.groupId);
    } else {
      await cancelReservation(r.id);
    }
    setCancellingId(null);
    await reload();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1.5">
          Painel Administrativo
        </p>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Gerencie e monitore todas as reservas</h1>
        <p className="text-base font-medium text-muted-foreground mt-1">
          Acompanhe métricas em tempo real, exporte relatórios e visualize o histórico completo.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CalendarBlank weight="bold" className="w-4 h-4 text-primary" />} iconBg="bg-primary/8" label="Reservas hoje" value={stats.today} sub={formatDateDisplay(today)} />
        <StatCard icon={<BookOpen weight="bold" className="w-4 h-4 text-primary" />} iconBg="bg-primary/8" label="Esta semana" value={stats.week} sub={`${formatDateDisplay(weekStart)} – ${formatDateDisplay(weekEnd)}`} onClick={() => setWeekModalOpen(true)} />
        <StatCard icon={<FileText weight="bold" className="w-4 h-4 text-primary" />} iconBg="bg-primary/8" label="Total geral" value={stats.total} sub="todas as reservas" />
        <StatCard icon={<Users weight="bold" className="w-4 h-4 text-primary" />} iconBg="bg-primary/8" label="Professores" value={stats.professors} sub="cadastrados" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-border rounded-xl p-1 w-fit">
        {([
          { key: "pedidos", label: "Pedidos por dia", icon: CalendarBlank },
          { key: "historico", label: "Histórico completo", icon: ClockCounterClockwise },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              activeTab === t.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon weight="bold" className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Aba: Pedidos por dia ────────────────────────────────────────────── */}
      {activeTab === "pedidos" && (
        <div className="bg-white border border-border rounded-xl overflow-hidden animate-fade-in shadow-sm">
          <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Pedidos do dia</h2>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {dayReservations.length} reserva{dayReservations.length !== 1 ? "s" : ""} · {displayedDateLabel}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
                  className="px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <CaretLeft weight="bold" className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-0 bg-transparent text-sm text-foreground px-2 py-1 focus:outline-none"
                />
                <button
                  onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
                  className="px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <CaretRight weight="bold" className="w-4 h-4" />
                </button>
              </div>
              {selectedDate === today ? (
                <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                  Hoje
                </span>
              ) : (
                <button
                  onClick={() => setSelectedDate(today)}
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Ir para hoje
                </button>
              )}
              <Button
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-1.5 text-xs rounded-lg"
              >
                <DownloadSimple weight="bold" className="w-3.5 h-3.5" />
                {downloading ? "Gerando..." : "Baixar PDF"}
              </Button>
            </div>
          </div>

          {dayReservations.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarBlank weight="bold" className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium text-foreground">Nenhum pedido neste dia.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    {["Professor / Responsável", "Item reservado", "Tipo", "Horário", "Qtd.", ""].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-sm font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayReservations.map((r) => (
                    <tr 
                      key={r.id} 
                      onClick={() => setSelectedResForDetails(r)}
                      className="border-b border-border hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 text-[15px] font-semibold text-foreground">{r.userName ?? r.userEmail ?? "—"}</td>
                      <td className="py-4 px-4 text-[15px] text-foreground">{r.itemName}</td>
                      <td className="py-4 px-4"><TypeBadge category={r.category} /></td>
                      <td className="py-4 px-4 text-[15px] font-medium text-foreground">{r.slots.join(" · ")}</td>
                      <td className="py-4 px-4 text-[15px] text-muted-foreground font-mono">{r.quantity ?? "—"}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(r);
                          }}
                          disabled={cancellingId === r.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-40"
                          title="Cancelar reserva"
                        >
                          <Trash weight="bold" className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Aba: Histórico completo ─────────────────────────────────────────── */}
      {activeTab === "historico" && (
        <div className="bg-white border border-border rounded-xl overflow-hidden animate-fade-in shadow-sm">
          <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Histórico completo</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {histFiltered.length} resultado{histFiltered.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Busca */}
              <div className="relative">
                <MagnifyingGlass weight="bold" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar professor ou item..."
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                  className="h-9 pl-9 pr-8 text-sm border border-border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
                />
                {histSearch && (
                  <button onClick={() => setHistSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X weight="bold" className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtro tipo */}
              <div className="flex gap-0.5 border border-border rounded-lg overflow-hidden p-0.5">
                {([
                  { key: "all", label: "Todos" },
                  { key: "espacos", label: "Espaços" },
                  { key: "instrumentos", label: "Equip." },
                ] as const).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setHistCategory(f.key)}
                    className={`px-2.5 py-1 text-xs font-bold uppercase transition-colors rounded ${
                      histCategory === f.key
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Filtro status */}
              <div className="flex gap-0.5 border border-border rounded-lg overflow-hidden p-0.5">
                {([
                  { key: "confirmada", label: "Ativas" },
                  { key: "cancelada", label: "Canceladas" },
                  { key: "todas", label: "Todas" },
                ] as const).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setHistStatus(f.key)}
                    className={`px-2.5 py-1 text-xs font-bold uppercase transition-colors rounded ${
                      histStatus === f.key
                        ? f.key === "cancelada"
                          ? "bg-rose-600 text-white"
                          : "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Export CSV */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                disabled={histFiltered.length === 0}
                className="flex items-center gap-1.5 text-xs rounded-lg border-border"
              >
                <FileCsv weight="bold" className="w-3.5 h-3.5" />
                CSV
              </Button>
            </div>
          </div>

          {histFiltered.length === 0 ? (
            <div className="py-16 text-center">
              <ClockCounterClockwise weight="bold" className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium text-foreground">Nenhuma reserva encontrada.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      {["Data", "Professor", "Item reservado", "Tipo", "Horário", "Qtd.", "Status", ""].map((h) => (
                        <th key={h} className="py-3 px-4 text-left text-sm font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {histPaged.map((r) => (
                      <tr 
                        key={r.id} 
                        onClick={() => setSelectedResForDetails(r)}
                        className={`border-b border-border transition-colors group cursor-pointer ${r.cancelledAt ? "hover:bg-rose-50/30 bg-rose-50/10" : "hover:bg-gray-50/80"}`}
                      >
                        <td className="py-4 px-4 text-xs font-bold text-muted-foreground whitespace-nowrap uppercase tracking-tighter">{formatDateDisplay(r.date)}</td>
                        <td className="py-4 px-4 text-[15px] font-semibold text-foreground">{r.userName ?? r.userEmail ?? "—"}</td>
                        <td className="py-4 px-4 text-[15px] text-foreground">{r.itemName}</td>
                        <td className="py-4 px-4"><TypeBadge category={r.category} /></td>
                        <td className="py-4 px-4 text-[15px] font-medium text-foreground">
                          {r.slots[0]}{r.slots.length > 1 && ` +${r.slots.length - 1}`}
                        </td>
                        <td className="py-4 px-4 text-[15px] text-muted-foreground font-mono">{r.quantity ?? "—"}</td>
                        <td className="py-4 px-4"><StatusBadge cancelled={!!r.cancelledAt} /></td>
                        <td className="py-4 px-4">
                          {!r.cancelledAt && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(r);
                              }}
                              disabled={cancellingId === r.id}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-40"
                              title="Cancelar reserva"
                            >
                              <Trash weight="bold" className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {histTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Página {histPage} de {histTotalPages} · {histFiltered.length} resultados
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                      disabled={histPage === 1}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretLeft weight="bold" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setHistPage((p) => Math.min(histTotalPages, p + 1))}
                      disabled={histPage === histTotalPages}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretRight weight="bold" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <WeeklyDetailModal open={weekModalOpen} onOpenChange={setWeekModalOpen} />

      {/* Modal de Detalhes da Reserva */}
      <Dialog open={!!selectedResForDetails} onOpenChange={(open) => !open && setSelectedResForDetails(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
              <Info weight="bold" className="w-6 h-6 text-primary" />
              Detalhes da Reserva
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre o agendamento realizado.
            </DialogDescription>
          </DialogHeader>

          {selectedResForDetails && (
            <div className="space-y-6 pt-4">
              {/* Seção Professor */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                  <Users weight="bold" className="w-4 h-4" />
                  Solicitante
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-base font-bold text-slate-900">{selectedResForDetails.userName ?? "Professor não identificado"}</p>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{selectedResForDetails.userEmail}</p>
                </div>
              </div>

              {/* Seção Item e Horário */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                    <Info weight="bold" className="w-4 h-4" />
                    Item
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-sm font-bold text-slate-900">{selectedResForDetails.itemName}</p>
                    <div className="mt-2">
                      <TypeBadge category={selectedResForDetails.category} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                    <CalendarBlank weight="bold" className="w-4 h-4" />
                    Data
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-sm font-bold text-slate-900">{formatDateDisplay(selectedResForDetails.date)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                      {selectedResForDetails.slots.length} horário(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Horários e Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                  <ClockCounterClockwise weight="bold" className="w-4 h-4" />
                  Grade de Horários
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedResForDetails.slots.map((slot) => (
                    <span key={slot} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              {/* Identificadores Técnicos */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <Hash weight="bold" className="w-3 h-3" />
                    ID da Reserva
                  </div>
                  <code className="text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                    {selectedResForDetails.id.split("-")[0]}...
                  </code>
                </div>
                {selectedResForDetails.groupId && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <IdentificationCard weight="bold" className="w-3 h-3" />
                      ID do Grupo
                    </div>
                    <code className="text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                      {selectedResForDetails.groupId.split("-")[0]}...
                    </code>
                  </div>
                )}
              </div>

              {/* Status Final */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                   <StatusBadge cancelled={!!selectedResForDetails.cancelledAt} />
                </div>
                {selectedResForDetails.quantity && (
                  <span className="text-sm font-bold text-primary">
                    {selectedResForDetails.quantity} unidades
                  </span>
                )}
              </div>
            </div>
          )}
          
          <Button 
            className="w-full mt-4" 
            onClick={() => setSelectedResForDetails(null)}
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
