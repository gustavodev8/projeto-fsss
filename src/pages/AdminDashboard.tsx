import { useState, useMemo } from "react";
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
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const StatCard = ({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <div className="bg-white border border-border rounded-xl p-5">
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mb-3">
      {icon}
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const { reservations } = useReservations();
  const [selectedDate, setSelectedDate] = useState(isoToday());
  const [downloading, setDownloading] = useState(false);

  const { data: professors = [] } = useQuery({
    queryKey: ["professors"],
    queryFn: listProfessors,
  });

  const today = isoToday();
  const { start: weekStart, end: weekEnd } = weekRange(today);

  const stats = useMemo(
    () => ({
      today: reservations.filter((r) => r.date === today).length,
      week: reservations.filter((r) => r.date >= weekStart && r.date <= weekEnd).length,
      total: reservations.length,
      professors: professors.length,
    }),
    [reservations, today, weekStart, weekEnd, professors]
  );

  const dayReservations = useMemo(
    () => reservations.filter((r) => r.date === selectedDate),
    [reservations, selectedDate]
  );

  const displayedDateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [selectedDate]);

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      generateDailyReportPDF({
        date: selectedDate,
        reservations: dayReservations,
        institutionName: "FSSS",
      });
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
          <h1 className="text-xl font-bold text-foreground">
            Gerencie e monitore todas as reservas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe métricas em tempo real, exporte relatórios e visualize o histórico completo.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<CalendarDays className="w-4 h-4 text-muted-foreground" />}
            label="Reservas hoje"
            value={stats.today}
            sub={formatDateDisplay(today)}
          />
          <StatCard
            icon={<BookOpen className="w-4 h-4 text-muted-foreground" />}
            label="Esta semana"
            value={stats.week}
            sub={`${formatDateDisplay(weekStart)} – ${formatDateDisplay(weekEnd)}`}
          />
          <StatCard
            icon={<Package className="w-4 h-4 text-muted-foreground" />}
            label="Total geral"
            value={stats.total}
            sub="todas as reservas"
          />
          <StatCard
            icon={<Users className="w-4 h-4 text-muted-foreground" />}
            label="Professores"
            value={stats.professors}
            sub="cadastrados"
          />
        </div>

        {/* Reservas do dia */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Pedidos recentes</h2>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {dayReservations.length} de {reservations.length} · {displayedDateLabel}
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
              {selectedDate !== today && (
                <button
                  onClick={() => setSelectedDate(today)}
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
            <div className="py-16 text-center text-muted-foreground">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-foreground">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    {["Professor / Responsável", "Item reservado", "Tipo", "Horário", "Qtd."].map(
                      (h) => (
                        <th
                          key={h}
                          className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {dayReservations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {r.userName ?? r.userEmail ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{r.itemName}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-gray-50">
                          {r.category === "espacos" ? "Espaço" : "Equipamento"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{r.slots.join(" · ")}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {r.quantity ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Por status */}
        {reservations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-border rounded-xl overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-sm font-semibold text-foreground">Histórico completo</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Todas as reservas registradas no sistema.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      {["Data", "Professor", "Item reservado", "Tipo", "Horário"].map((h) => (
                        <th
                          key={h}
                          className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...reservations]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-border hover:bg-gray-50/80 transition-colors"
                        >
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateDisplay(r.date)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">
                            {r.userName ?? r.userEmail ?? "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">{r.itemName}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-gray-50">
                              {r.category === "espacos" ? "Espaço" : "Equipamento"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {r.slots[0]}
                            {r.slots.length > 1 && ` +${r.slots.length - 1}`}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Por status */}
            <div className="bg-white border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Por status</h2>
              <div className="space-y-3">
                {[
                  { label: "Confirmada", count: reservations.length, dot: "bg-available" },
                  { label: "Aguardando", count: 0, dot: "bg-yellow-400" },
                  { label: "Cancelada", count: 0, dot: "bg-destructive" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="text-sm text-foreground">{s.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{s.count}</span>
                  </div>
                ))}
              </div>
              {reservations.length === 0 && (
                <p className="text-xs text-muted-foreground mt-4">Sem dados ainda</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
