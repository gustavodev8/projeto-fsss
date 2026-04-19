import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReservations } from "@/contexts/ReservationContext";
import { generateDailyReportPDF } from "@/lib/pdfUtils";
import { listProfessors } from "@/services/users";
import AdminHeader from "@/components/AdminHeader";
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

const StatCard = ({ icon, label, value, sub }: StatCardProps) => (
  <div className="bg-white border border-border rounded p-5">
    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-3xl font-bold text-foreground">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
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
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Título */}
        <div className="border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Painel Administrativo
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Gerencie e monitore todas as reservas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe métricas em tempo real, exporte relatórios e visualize o histórico completo
            da instituição.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<CalendarDays className="w-4 h-4" />}
            label="Reservas Hoje"
            value={stats.today}
            sub={formatDateDisplay(today)}
          />
          <StatCard
            icon={<BookOpen className="w-4 h-4" />}
            label="Esta Semana"
            value={stats.week}
            sub={`${formatDateDisplay(weekStart)} – ${formatDateDisplay(weekEnd)}`}
          />
          <StatCard
            icon={<Package className="w-4 h-4" />}
            label="Total Geral"
            value={stats.total}
            sub="todas as reservas"
          />
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Professores"
            value={stats.professors}
            sub="cadastrados"
          />
        </div>

        {/* Reservas do dia */}
        <div className="bg-white border border-border rounded overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Reservas do dia</h2>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{displayedDateLabel}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center border border-border rounded overflow-hidden">
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
                className="flex items-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? "Gerando..." : "Baixar PDF"}
              </Button>
            </div>
          </div>

          {dayReservations.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Nenhuma reserva para esta data</p>
              <p className="text-xs text-muted-foreground mt-1">
                Não há reservas registradas para {formatDateDisplay(selectedDate)}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {[
                      "Professor / Responsável",
                      "Item Reservado",
                      "Tipo",
                      "Horário",
                      "Qtd.",
                    ].map((h) => (
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
                  {dayReservations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {r.userName ?? r.userEmail ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{r.itemName}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-border text-muted-foreground">
                          {r.category === "espacos" ? "Espaço" : "Equipamento"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {r.slots.join(" · ")}
                      </td>
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

        {/* Histórico completo */}
        {reservations.length > 0 && (
          <div className="bg-white border border-border rounded overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Histórico completo</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Todas as reservas registradas no sistema.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {["Data", "Professor / Responsável", "Item Reservado", "Tipo", "Horário", "Qtd."].map(
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
                  {[...reservations]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateDisplay(r.date)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                          {r.userName ?? r.userEmail ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{r.itemName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-border text-muted-foreground">
                            {r.category === "espacos" ? "Espaço" : "Equipamento"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {r.slots.join(" · ")}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {r.quantity ?? "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-4">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© 2026 FSSS — Fundação Social Santa Sé</p>
          <p className="text-xs text-muted-foreground">Sistema Interno de Reservas · v1.0</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
