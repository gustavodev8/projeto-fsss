import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Reservation } from "@/types";
import { generateDailyReportPDF } from "@/lib/pdfUtils";
import { listProfessors, createProfessor, updateProfessor, deleteProfessor } from "@/services/users";
import { fetchAllItems, createItem, deleteItem, updateItem } from "@/services/items";
import type { ReservableItem } from "@/types";
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
  Building2,
  Box,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
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

  // ── Estado do formulário de itens ───────────────────────────────────────
  const [itemCategoria, setItemCategoria] = useState<"espacos" | "instrumentos">("espacos");
  const [itemNome, setItemNome] = useState("");
  const [itemDescricao, setItemDescricao] = useState("");
  const [itemImagemUrl, setItemImagemUrl] = useState("");
  const [itemQtd, setItemQtd] = useState(1);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState("");
  const [itemSuccess, setItemSuccess] = useState(false);
  const [itemListTab, setItemListTab] = useState<"espacos" | "instrumentos">("espacos");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: allItems = [], refetch: refetchItems } = useQuery({
    queryKey: ["allItems"],
    queryFn: fetchAllItems,
  });

  const espacosList = allItems.filter((i) => i.category === "espacos");
  const instrumentosList = allItems.filter((i) => i.category === "instrumentos");

  // ── Estado de edição de professores ─────────────────────────────────────
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [editProfNome, setEditProfNome] = useState("");
  const [editProfEmail, setEditProfEmail] = useState("");
  const [editProfSenha, setEditProfSenha] = useState("");
  const [editProfLoading, setEditProfLoading] = useState(false);

  // ── Estado de edição de itens ────────────────────────────────────────────
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemNome, setEditItemNome] = useState("");
  const [editItemDescricao, setEditItemDescricao] = useState("");
  const [editItemImagemUrl, setEditItemImagemUrl] = useState("");
  const [editItemQtd, setEditItemQtd] = useState(1);
  const [editItemCategoria, setEditItemCategoria] = useState<"espacos" | "instrumentos">("espacos");
  const [editItemLoading, setEditItemLoading] = useState(false);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError("");
    setItemSuccess(false);
    setItemLoading(true);
    const result = await createItem({
      nome: itemNome.trim(),
      descricao: itemDescricao.trim(),
      categoria: itemCategoria,
      imagemUrl: itemImagemUrl.trim() || undefined,
      totalUnidades: itemCategoria === "instrumentos" ? itemQtd : undefined,
    });
    setItemLoading(false);
    if (!result.ok) {
      setItemError(result.error ?? "Erro ao criar item.");
      return;
    }
    setItemNome("");
    setItemDescricao("");
    setItemImagemUrl("");
    setItemQtd(1);
    setItemSuccess(true);
    refetchItems();
    queryClient.invalidateQueries({ queryKey: ["items", itemCategoria] });
    setTimeout(() => setItemSuccess(false), 3000);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    setDeletingId(id);
    const result = await deleteItem(id);
    setDeletingId(null);
    if (!result.ok) {
      alert("Não foi possível remover. Verifique se não há reservas ativas para este item.");
      return;
    }
    refetchItems();
    queryClient.invalidateQueries({ queryKey: ["items", "espacos"] });
    queryClient.invalidateQueries({ queryKey: ["items", "instrumentos"] });
  };

  const handleEditItem = (item: ReservableItem) => {
    setEditingItemId(item.id);
    setEditItemNome(item.name);
    setEditItemDescricao(item.description);
    setEditItemImagemUrl(item.image);
    setEditItemQtd(item.totalUnits ?? 1);
    setEditItemCategoria(item.category);
  };

  const handleSaveItem = async (id: string) => {
    setEditItemLoading(true);
    const result = await updateItem({
      id,
      nome: editItemNome.trim(),
      descricao: editItemDescricao.trim(),
      imagemUrl: editItemImagemUrl.trim() || undefined,
      totalUnidades: editItemCategoria === "instrumentos" ? editItemQtd : undefined,
    });
    setEditItemLoading(false);
    if (!result.ok) {
      alert(result.error ?? "Erro ao atualizar item.");
      return;
    }
    setEditingItemId(null);
    refetchItems();
    queryClient.invalidateQueries({ queryKey: ["items", editItemCategoria] });
  };

  const handleEditProfessor = (p: { id: string; nome: string; email: string }) => {
    setEditingProfId(p.id);
    setEditProfNome(p.nome);
    setEditProfEmail(p.email);
    setEditProfSenha("");
  };

  const handleSaveProfessor = async (id: string) => {
    setEditProfLoading(true);
    const result = await updateProfessor(id, editProfNome.trim(), editProfEmail.trim(), editProfSenha || undefined);
    setEditProfLoading(false);
    if (!result.ok) {
      alert(result.error ?? "Erro ao atualizar professor.");
      return;
    }
    setEditingProfId(null);
    queryClient.invalidateQueries({ queryKey: ["professors"] });
  };

  const handleDeleteProfessor = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este professor?")) return;
    const result = await deleteProfessor(id);
    if (!result.ok) {
      alert(result.error ?? "Erro ao excluir professor.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["professors"] });
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
        {/* ── Seção: Gerenciar Espaços e Equipamentos ──────────────────────── */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="border-b border-border px-5 py-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <div>
              <h2 className="text-base text-foreground">Gerenciar Espaços e Equipamentos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adicione ou remova itens disponíveis para reserva.
              </p>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de criação */}
            <form onSubmit={handleCreateItem} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Novo item</h3>

              {/* Categoria */}
              <div className="flex gap-2">
                {(["espacos", "instrumentos"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setItemCategoria(cat)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded border transition-colors ${
                      itemCategoria === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {cat === "espacos"
                      ? <><Building2 className="w-3.5 h-3.5" /> Espaço</>
                      : <><Box className="w-3.5 h-3.5" /> Equipamento</>}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nome</Label>
                <Input
                  placeholder={itemCategoria === "espacos" ? "Ex: Espaço Irmã Rosa" : "Ex: Caixa de Som"}
                  value={itemNome}
                  onChange={(e) => setItemNome(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descrição</Label>
                <Input
                  placeholder="Breve descrição do item"
                  value={itemDescricao}
                  onChange={(e) => setItemDescricao(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">URL da imagem <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input
                  placeholder="https://..."
                  value={itemImagemUrl}
                  onChange={(e) => setItemImagemUrl(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {itemCategoria === "instrumentos" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Quantidade total</Label>
                  <Input
                    type="number"
                    min={1}
                    value={itemQtd}
                    onChange={(e) => setItemQtd(Math.max(1, Number(e.target.value)))}
                    required
                    className="h-9 text-sm w-28 font-mono"
                  />
                </div>
              )}

              {itemError && (
                <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded px-3 py-2">
                  {itemError}
                </p>
              )}

              {itemSuccess && (
                <div className="flex items-center gap-2 text-xs text-available bg-available/8 border border-available/20 rounded px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Item adicionado com sucesso!
                </div>
              )}

              <Button type="submit" disabled={itemLoading} className="w-full h-9 text-sm gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                {itemLoading ? "Adicionando..." : "Adicionar Item"}
              </Button>
            </form>

            {/* Lista de itens */}
            <div>
              <div className="flex gap-2 mb-3">
                {(["espacos", "instrumentos"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setItemListTab(cat)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                      itemListTab === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {cat === "espacos" ? `Espaços (${espacosList.length})` : `Equipamentos (${instrumentosList.length})`}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {(itemListTab === "espacos" ? espacosList : instrumentosList).map((item) => (
                  <div
                    key={item.id}
                    className="rounded border border-border px-3 py-2.5"
                  >
                    {editingItemId === item.id ? (
                      <div className="space-y-2">
                        <Input value={editItemNome} onChange={(e) => setEditItemNome(e.target.value)} className="h-8 text-sm" placeholder="Nome" />
                        <Input value={editItemDescricao} onChange={(e) => setEditItemDescricao(e.target.value)} className="h-8 text-sm" placeholder="Descrição" />
                        <Input value={editItemImagemUrl} onChange={(e) => setEditItemImagemUrl(e.target.value)} className="h-8 text-sm" placeholder="URL da imagem" />
                        {item.category === "instrumentos" && (
                          <Input type="number" min={1} value={editItemQtd} onChange={(e) => setEditItemQtd(Math.max(1, Number(e.target.value)))} className="h-8 text-sm w-24 font-mono" placeholder="Qtd" />
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleSaveItem(item.id)} disabled={editItemLoading}>
                            <Save className="w-3 h-3" />{editItemLoading ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditingItemId(null)}>
                            <X className="w-3 h-3" />Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          {item.totalUnits && (
                            <p className="text-xs text-muted-foreground">Qtd: {item.totalUnits}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleEditItem(item)} title="Editar" className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} disabled={deletingId === item.id} title="Remover" className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-40">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(itemListTab === "espacos" ? espacosList : instrumentosList).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>
                )}
              </div>
            </div>
          </div>
        </div>

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
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {professors.map((p) => (
                    <div
                      key={p.id}
                      className="rounded border border-border px-3 py-2.5"
                    >
                      {editingProfId === p.id ? (
                        <div className="space-y-2">
                          <Input value={editProfNome} onChange={(e) => setEditProfNome(e.target.value)} className="h-8 text-sm" placeholder="Nome completo" />
                          <Input value={editProfEmail} onChange={(e) => setEditProfEmail(e.target.value)} className="h-8 text-sm" placeholder="E-mail" />
                          <Input value={editProfSenha} onChange={(e) => setEditProfSenha(e.target.value)} className="h-8 text-sm font-mono" placeholder="Nova senha (deixe vazio para manter)" />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleSaveProfessor(p.id)} disabled={editProfLoading}>
                              <Save className="w-3 h-3" />{editProfLoading ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditingProfId(null)}>
                              <X className="w-3 h-3" />Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${p.ativo ? "bg-available/10 text-available" : "bg-muted text-muted-foreground"}`}>
                              {p.ativo ? "Ativo" : "Inativo"}
                            </span>
                            <button onClick={() => handleEditProfessor(p)} title="Editar" className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteProfessor(p.id)} title="Excluir" className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
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
