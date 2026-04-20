import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReservations } from "@/contexts/ReservationContext";
import { generateDailyReportPDF } from "@/lib/pdfUtils";
import { listProfessors } from "@/services/users";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  Download,
  Users,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  History,
  Search,
} from "lucide-react";

const HIST_PAGE_SIZE = 25;

function formatDateDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function isoToday() {
  return new Date().toISOString().split("T")[0];
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function weekRange(iso: string) {
  const d = new Date(iso + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split("T")[0],
    end: sun.toISOString().split("T")[0],
  };
}

const TypeBadge = ({ category }: { category: string }) => (
  <span className={`inline-flex items-center text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
    category === "espacos"
      ? "bg-violet-50 text-violet-700 border border-violet-100"
      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
  }`}>
    {category === "espacos" ? "Espaço" : "Equipamento"}
  </span>
);

const StatCard = ({
  icon, label, value, sub, iconBg = "bg-gray-100",
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; iconBg?: string;
}) => (
  <div className="bg-white border border-border rounded-xl p-5 hover:shadow-sm transition-shadow duration-200">
    <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const { reservations } = useReservations();
  const sessionToday = useRef(isoToday()).current;

  const [selectedDate, setSelectedDate] = useState(sessionToday);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pedidos" | "historico">("pedidos");
  const [histSearch, setHistSearch] = useState("");
  const [histCategory, setHistCategory] = useState<"all" | "espacos" | "instrumentos">("all");
  const [histPage, setHistPage] = useState(1);

  const { data: professors = [] } = useQuery({
    queryKey: ["professors"],
    queryFn: listProfessors,
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

  const histFiltered = useMemo(() => {
    return [...reservations]
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
  }, [reservations, histSearch, histCategory]);

  useEffect(() => {
    setHistPage(1);
  }, [histSearch, histCategory]);

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

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Título */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Painel Administrativo
          </p>
          <h1 className="text-xl font-bold text-foreground">Gerencie e monitore todas as reservas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe métricas em tempo real, exporte relatórios e visualize o histórico completo.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<CalendarDays className="w-4 h-4 text-primary" />} iconBg="bg-primary/8" label="Reservas hoje" value={stats.today} sub={formatDateDisplay(today)} />
          <StatCard icon={<BookOpen className="w-4 h-4 text-violet-600" />} iconBg="bg-violet-50" label="Esta semana" value={stats.week} sub={`${formatDateDisplay(weekStart)} – ${formatDateDisplay(weekEnd)}`} />
          <StatCard icon={<FileText className="w-4 h-4 text-amber-600" />} iconBg="bg-amber-50" label="Total geral" value={stats.total} sub="todas as reservas" />
          <StatCard icon={<Users className="w-4 h-4 text-emerald-600" />} iconBg="bg-emerald-50" label="Professores" value={stats.professors} sub="cadastrados" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-border rounded-xl p-1 w-fit">
          {([
            { key: "pedidos", label: "Pedidos por dia", icon: CalendarDays },
            { key: "historico", label: "Histórico completo", icon: History },
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
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Aba: Pedidos por dia ────────────────────────────────────────────── */}
        {activeTab === "pedidos" && (
          <div className="bg-white border border-border rounded-xl overflow-hidden animate-fade-in">
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
                    <ChevronLeft className="w-4 h-4" />
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
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {selectedDate !== sessionToday && (
                  <button
                    onClick={() => setSelectedDate(sessionToday)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Hoje
                  </button>
                )}
                <Button
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-1.5 text-xs rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? "Gerando..." : "Baixar PDF"}
                </Button>
              </div>
            </div>

            {dayReservations.length === 0 ? (
              <div className="py-16 text-center">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm font-medium text-foreground">Nenhum pedido neste dia.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      {["Professor / Responsável", "Item reservado", "Tipo", "Horário", "Qtd."].map((h) => (
                        <th key={h} className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dayReservations.map((r) => (
                      <tr key={r.id} className="border-b border-border hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-foreground">{r.userName ?? r.userEmail ?? "—"}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{r.itemName}</td>
                        <td className="py-3 px-4"><TypeBadge category={r.category} /></td>
                        <td className="py-3 px-4 text-sm text-foreground">{r.slots.join(" · ")}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{r.quantity ?? "—"}</td>
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
          <div className="bg-white border border-border rounded-xl overflow-hidden animate-fade-in">
            <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Histórico completo</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {histFiltered.length} de {reservations.length} reservas
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar professor ou item..."
                    value={histSearch}
                    onChange={(e) => setHistSearch(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs border border-border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
                  />
                </div>
                <div className="flex gap-1 border border-border rounded-lg overflow-hidden">
                  {([
                    { key: "all", label: "Todos" },
                    { key: "espacos", label: "Espaços" },
                    { key: "instrumentos", label: "Equipamentos" },
                  ] as const).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setHistCategory(f.key)}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                        histCategory === f.key
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {histFiltered.length === 0 ? (
              <div className="py-16 text-center">
                <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm font-medium text-foreground">Nenhuma reserva encontrada.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-gray-50/50">
                        {["Data", "Professor", "Item reservado", "Tipo", "Horário", "Qtd."].map((h) => (
                          <th key={h} className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {histPaged.map((r) => (
                        <tr key={r.id} className="border-b border-border hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{formatDateDisplay(r.date)}</td>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{r.userName ?? r.userEmail ?? "—"}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{r.itemName}</td>
                          <td className="py-3 px-4"><TypeBadge category={r.category} /></td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {r.slots[0]}{r.slots.length > 1 && ` +${r.slots.length - 1}`}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{r.quantity ?? "—"}</td>
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
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setHistPage((p) => Math.min(histTotalPages, p + 1))}
                        disabled={histPage === histTotalPages}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
