import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Reservation } from "@/types";
import { generateDailyReportPDF } from "@/lib/pdfUtils";
import { listProfessors, createProfessor } from "@/services/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import unnamedLogo from "@/assets/logo.png";

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
    <td className="py-3 px-4 text-sm text-muted-foreground">
      {r.category === "espacos" ? "Espaço" : "Equipamento"}
    </td>
    <td className="py-3 px-4 text-sm text-foreground">
      {r.slots.join("  ·  ")}
    </td>
    <td className="py-3 px-4 text-sm text-center text-muted-foreground">
      {r.quantity ?? "—"}
    </td>
    <td className="py-3 px-4 text-sm text-center text-muted-foreground">
      {r.groupId ? "Sim" : "—"}
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
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>(isoToday());
  const [downloading, setDownloading] = useState(false);

  // ── Estado do formulário de professores ──────────────────────────────────
  const [profNome, setProfNome] = useState("");
  const [profEmail, setProfEmail] = useState("");
  const [profSenha, setProfSenha] = useState("");
  const [profLoading, setProfLoading] = useState(false);
  const [profError, setProfError] = useState("");
  const [profSuccess, setProfSuccess] = useState(false);

  const { data: professors = [] } = useQuery({
    queryKey: ["professors"],
    queryFn: listProfessors,
  });

  const handleCreateProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfError("");
    setProfSuccess(false);
    setProfLoading(true);
    const result = await createProfessor(profNome.trim(), profEmail.trim(), profSenha);
    setProfLoading(false);
    if (!result.ok) {
      setProfError(result.error ?? "Erro ao criar professor.");
      return;
    }
    setProfNome("");
    setProfEmail("");
    setProfSenha("");
    setProfSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["professors"] });
    setTimeout(() => setProfSuccess(false), 3000);
  };

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
                        <td className="py-2.5 px-4 text-sm text-muted-foreground">
                          {r.category === "espacos" ? "Espaço" : "Equipamento"}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-foreground">
                          {r.slots.join("  ·  ")}
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
        {/* ── Seção: Gerenciar Professores ─────────────────────────────────── */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="border-b border-border px-5 py-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <div>
              <h2 className="text-base text-foreground">Gerenciar Professores</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crie logins para novos professores.
              </p>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de criação */}
            <form onSubmit={handleCreateProfessor} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Novo professor</h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nome completo</Label>
                <Input
                  placeholder="Prof. João Silva"
                  value={profNome}
                  onChange={(e) => setProfNome(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">E-mail institucional</Label>
                <Input
                  type="email"
                  placeholder="joao.silva@fsss.edu.br"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Senha inicial</Label>
                <Input
                  type="text"
                  placeholder="Senha que o professor usará para entrar"
                  value={profSenha}
                  onChange={(e) => setProfSenha(e.target.value)}
                  required
                  minLength={4}
                  className="h-9 text-sm font-mono"
                />
              </div>

              {profError && (
                <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded px-3 py-2">
                  {profError}
                </p>
              )}

              {profSuccess && (
                <div className="flex items-center gap-2 text-xs text-available bg-available/8 border border-available/20 rounded px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Professor criado com sucesso!
                </div>
              )}

              <Button type="submit" disabled={profLoading} className="w-full h-9 text-sm">
                {profLoading ? "Criando..." : "Criar Professor"}
              </Button>
            </form>

            {/* Lista de professores cadastrados */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Professores cadastrados ({professors.length})
              </h3>
              {professors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum professor cadastrado ainda.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {professors.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded border border-border px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          p.ativo
                            ? "bg-available/10 text-available"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
