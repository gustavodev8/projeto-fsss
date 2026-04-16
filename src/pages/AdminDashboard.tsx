import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Reservation } from "@/data/mockData";
import { generateDailyReportPDF } from "@/lib/pdfUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  Download,
  LogOut,
  Users,
  BookOpen,
  Package,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import unnamedLogo from "@/unnamed.png";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function isoToday(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function weekRange(iso: string): { start: string; end: string } {
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

// ──────────────────────────────────────────────────────────────────────────────
// StatCard
// ──────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

const StatCard = ({ icon, label, value, sub }: StatCardProps) => (
  <div className="bg-card border border-border rounded p-5 flex items-start gap-4">
    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-foreground font-sans">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// ReservationRow
// ──────────────────────────────────────────────────────────────────────────────

const ReservationRow = ({ r }: { r: Reservation }) => (
  <tr className="border-b border-border hover:bg-muted/40 transition-colors">
    <td className="py-3 px-4 text-sm font-medium text-foreground">
      {r.userName ?? r.userEmail ?? "—"}
    </td>
    <td className="py-3 px-4 text-sm text-foreground">{r.itemName}</td>
    <td className="py-3 px-4">
      <Badge
        variant="outline"
        className={
          r.category === "espacos"
            ? "border-primary/40 text-primary text-[11px]"
            : "border-muted-foreground/40 text-muted-foreground text-[11px]"
        }
      >
        {r.category === "espacos" ? "Espaço" : "Equipamento"}
      </Badge>
    </td>
    <td className="py-3 px-4 text-sm text-muted-foreground font-mono text-xs">
      {r.slots.join(" | ")}
    </td>
    <td className="py-3 px-4 text-sm text-center text-muted-foreground">
      {r.quantity ?? "—"}
    </td>
    <td className="py-3 px-4 text-sm text-center">
      {r.groupId ? (
        <Badge variant="outline" className="text-[11px] border-muted-foreground/30 text-muted-foreground">
          Agrupado
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )}
    </td>
  </tr>
);

// ──────────────────────────────────────────────────────────────────────────────
// AdminDashboard
// ──────────────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { reservations } = useReservations();

  const [selectedDate, setSelectedDate] = useState<string>(isoToday());
  const [downloading, setDownloading] = useState(false);

  const today = isoToday();
  const { start: weekStart, end: weekEnd } = weekRange(today);

  // ── Estatísticas gerais ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const todayRes = reservations.filter((r) => r.date === today);
    const weekRes = reservations.filter((r) => r.date >= weekStart && r.date <= weekEnd);
    const professors = new Set(reservations.map((r) => r.userEmail)).size;
    return {
      total: reservations.length,
      today: todayRes.length,
      week: weekRes.length,
      professors,
    };
  }, [reservations, today, weekStart, weekEnd]);

  // ── Reservas do dia selecionado ──────────────────────────────────────────
  const dayReservations = useMemo(
    () => reservations.filter((r) => r.date === selectedDate),
    [reservations, selectedDate]
  );

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

  const navigateDay = (delta: number) => {
    setSelectedDate((prev) => addDays(prev, delta));
  };

  const displayedDateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Barra de navegação institucional ──────────────────────────────── */}
      <header className="bg-card border-b border-border">
        {/* Tira azul fina no topo */}
        <div className="h-1 bg-primary w-full" />
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
          >
            <img src={unnamedLogo} alt="Logo FSSS" className="h-8 w-8 object-contain" />
            <div className="text-left">
              <p className="text-sm font-bold leading-tight tracking-tight">FSSS</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Sistema de Reservas</p>
            </div>
          </button>

          <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded text-primary">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Painel Administrativo</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={logout}
              title="Sair"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* ── Título da página ──────────────────────────────────────────────── */}
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl text-foreground">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e monitore todas as reservas da instituição.
          </p>
        </div>

        {/* ── Cards de estatísticas ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<CalendarDays className="w-5 h-5" />}
            label="Reservas Hoje"
            value={stats.today}
            sub={formatDateDisplay(today)}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Esta Semana"
            value={stats.week}
            sub={`${formatDateDisplay(weekStart)} – ${formatDateDisplay(weekEnd)}`}
          />
          <StatCard
            icon={<Package className="w-5 h-5" />}
            label="Total Geral"
            value={stats.total}
            sub="todas as reservas"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Professores"
            value={stats.professors}
            sub="com reservas ativas"
          />
        </div>

        {/* ── Seção: Reservas por dia ───────────────────────────────────────── */}
        <div className="bg-card border border-border rounded overflow-hidden">
          {/* Cabeçalho da seção */}
          <div className="border-b border-border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base text-foreground">Reservas do Dia</h2>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{displayedDateLabel}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Navegação de datas */}
              <div className="flex items-center gap-1 border border-border rounded overflow-hidden">
                <button
                  onClick={() => navigateDay(-1)}
                  className="px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Dia anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-0 bg-transparent text-sm text-foreground px-2 py-1 focus:outline-none focus:ring-0"
                />
                <button
                  onClick={() => navigateDay(1)}
                  className="px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Próximo dia"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Botão hoje */}
              {selectedDate !== today && (
                <button
                  onClick={() => setSelectedDate(today)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Hoje
                </button>
              )}

              {/* Download PDF */}
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

          {/* Tabela */}
          {dayReservations.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma reserva registrada para {formatDateDisplay(selectedDate)}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Professor / Responsável
                    </th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Item Reservado
                    </th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Horários
                    </th>
                    <th className="py-2.5 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Qtd.
                    </th>
                    <th className="py-2.5 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Agrupamento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dayReservations.map((r) => (
                    <ReservationRow key={r.id} r={r} />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/30">
                    <td colSpan={6} className="py-2.5 px-4 text-xs text-muted-foreground">
                      {dayReservations.length} reserva{dayReservations.length !== 1 ? "s" : ""} em{" "}
                      {formatDateDisplay(selectedDate)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ── Seção: Todas as reservas ─────────────────────────────────────── */}
        {reservations.length > 0 && (
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base text-foreground">Histórico Completo</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Todas as reservas registradas no sistema.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Data
                    </th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Professor / Responsável
                    </th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Item Reservado
                    </th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Horários
                    </th>
                    <th className="py-2.5 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Qtd.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...reservations]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateDisplay(r.date)}
                        </td>
                        <td className="py-2.5 px-4 text-sm font-medium text-foreground">
                          {r.userName ?? r.userEmail ?? "—"}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-foreground">{r.itemName}</td>
                        <td className="py-2.5 px-4">
                          <Badge
                            variant="outline"
                            className={
                              r.category === "espacos"
                                ? "border-primary/40 text-primary text-[11px]"
                                : "border-muted-foreground/40 text-muted-foreground text-[11px]"
                            }
                          >
                            {r.category === "espacos" ? "Espaço" : "Equipamento"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-xs font-mono text-muted-foreground">
                          {r.slots.join(" | ")}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-center text-muted-foreground">
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
    </div>
  );
};

export default AdminDashboard;
