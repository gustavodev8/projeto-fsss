import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReservations } from "@/contexts/ReservationContext";
import { listProfessors } from "@/services/users";
import { fetchAllItems, fetchHorarios } from "@/services/items";
import { DoorOpen, Package, CalendarDays } from "lucide-react";
import {
  CalendarBlank,
  UsersThree,
  TrendUp,
  ChartBar,
  Buildings,
  Cube,
  ArrowRight as PhArrowRight,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
    start: mon.toLocaleDateString("en-CA"),
    end: sun.toLocaleDateString("en-CA"),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Hub do Professor
// ──────────────────────────────────────────────────────────────────────────────

const professorCategories = [
  {
    key: "espacos",
    label: "Espaços",
    subtitle: "Salas, laboratórios, auditórios e áreas externas",
    icon: DoorOpen,
    path: "/espacos",
  },
  {
    key: "instrumentos",
    label: "Equipamentos",
    subtitle: "Projetores, notebooks, microfones e caixas de som",
    icon: Package,
    path: "/instrumentos",
  },
];

const ProfessorHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reservations } = useReservations();

  const today = new Date().toLocaleDateString("en-CA");

  // Calendar state
  const nowDate = new Date();
  const [calYear, setCalYear] = useState(nowDate.getFullYear());
  const [calMonth, setCalMonth] = useState(nowDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>(today);

  const myUpcoming = reservations.filter(
    (r) => r.userEmail === user?.email && r.date >= today
  );

  // Build date → reservations index
  const resByDate: Record<string, typeof reservations> = {};
  for (const r of reservations) {
    (resByDate[r.date] ??= []).push(r);
  }

  // Calendar math
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const rawFirstDow = new Date(calYear, calMonth, 1).getDay();
  const startOffset = rawFirstDow === 0 ? 6 : rawFirstDow - 1; // Monday = 0

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  const { data: allSlots = [] } = useQuery({
    queryKey: ["horarios"],
    queryFn: fetchHorarios,
  });

  const selectedDayRes = useMemo(() => {
    const list = resByDate[selectedDay] ?? [];
    if (allSlots.length === 0) return list;
    
    // Sort by the 'ordem' (using index in allSlots) of the first slot
    return [...list].sort((a, b) => {
      const idxA = allSlots.findIndex(s => s.label === a.slots[0]);
      const idxB = allSlots.findIndex(s => s.label === b.slots[0]);
      return idxA - idxB;
    });
  }, [resByDate, selectedDay, allSlots]);

  const selectedDayFmt = selectedDay.split("-").reverse().join("/");

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />
      <main className="max-w-[1200px] mx-auto px-6 py-10">

        {/* Greeting */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-0.5">
            {greeting()},{" "}
            <span className="font-medium text-foreground">{user?.name}</span>
          </p>
          <h1 className="text-2xl font-extrabold text-[#0D1F3C]">O que deseja reservar?</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione uma categoria para verificar disponibilidade e realizar sua reserva.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {professorCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(cat.path)}
              className="bg-white border border-border rounded-xl p-8 min-h-[160px] text-left transition-all duration-[180ms] hover:-translate-y-1 shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] group cursor-pointer"
              style={{ borderLeftColor: "#1A56DB", borderLeftWidth: "4px" }}
            >
              <div className="w-12 h-12 rounded-full bg-[#E8F0FE] flex items-center justify-center mb-5">
                <cat.icon className="w-6 h-6 text-[#1A56DB]" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">{cat.label}</h2>
              <p className="text-base text-muted-foreground">{cat.subtitle}</p>
            </button>
          ))}
        </div>

        {/* Upcoming reservations */}
        {myUpcoming.length > 0 && (
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] mb-6">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">
                  Suas próximas reservas
                </h2>
              </div>
              <button
                onClick={() => navigate("/minhas-reservas")}
                className="text-sm text-primary hover:underline font-medium"
              >
                Ver todas
              </button>
            </div>
            <div className="divide-y divide-border">
              {myUpcoming.slice(0, 3).map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-foreground">{r.itemName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {r.date.split("-").reverse().join("/")} · {r.slots[0]}
                      {r.slots.length > 1 &&
                        ` +${r.slots.length - 1} horário${r.slots.length > 2 ? "s" : ""}`}
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#D1FAE5] text-[#065F46]">
                    Confirmada
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar card */}
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="grid lg:grid-cols-[1fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">

            {/* ── Left: Monthly calendar ── */}
            <div className="p-6">
              {/* Month header */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-base font-semibold text-foreground">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <CaretLeft weight="bold" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <CaretRight weight="bold" className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[11px] font-semibold text-muted-foreground/60 py-1 select-none"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: startOffset }, (_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const iso = toISO(calYear, calMonth, day);
                  const hasRes = (resByDate[iso]?.length ?? 0) > 0;
                  const isToday = iso === today;
                  const isSelected = iso === selectedDay;
                  const colIndex = (startOffset + i) % 7;
                  const isWeekend = colIndex >= 5;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(iso)}
                      className={`
                        relative flex flex-col items-center justify-center h-9 rounded-lg text-[13px] font-medium transition-all duration-150 select-none
                        ${isSelected
                          ? "bg-primary text-white shadow-sm"
                          : isToday
                          ? "ring-2 ring-primary/40 text-primary font-semibold"
                          : isWeekend
                          ? "text-muted-foreground/40 hover:bg-accent"
                          : "text-foreground hover:bg-accent"}
                      `}
                    >
                      {day}
                      {hasRes && (
                        <span
                          className={`absolute bottom-1 w-1 h-1 rounded-full ${
                            isSelected ? "bg-white/70" : "bg-primary"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  <span className="text-[11px] text-muted-foreground">Possui reservas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md ring-2 ring-primary/40 inline-block" />
                  <span className="text-[11px] text-muted-foreground">Hoje</span>
                </div>
              </div>
            </div>

            {/* ── Right: Day detail ── */}
            <div className="p-6 flex flex-col h-[420px] lg:h-auto">
              {/* Detail header */}
              <div className="flex items-center gap-2 mb-4 shrink-0">
                <CalendarBlank weight="bold" className="w-4 h-4 text-primary shrink-0" />
                <span className="text-base font-semibold text-foreground">
                  {selectedDayFmt}
                </span>
                {selectedDayRes.length > 0 && (
                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {selectedDayRes.length} reserva{selectedDayRes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {selectedDayRes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
                  <CalendarBlank weight="thin" className="w-10 h-10 text-muted-foreground/25" />
                  <p className="text-sm font-medium text-muted-foreground">Nenhuma reserva neste dia</p>
                  <p className="text-xs text-muted-foreground/60">O espaço está totalmente disponível</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar max-h-[320px]">
                  {selectedDayRes.map((r) => {
                    const isOwn = r.userEmail === user?.email;
                    const initials = r.userName
                      ?.split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0].toUpperCase())
                      .join("") ?? "?";

                    return (
                      <div
                        key={r.id}
                        className={`rounded-xl border p-3.5 transition-colors shrink-0 ${
                          isOwn
                            ? "border-primary/25 bg-primary/5"
                            : "border-border bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight truncate">
                              {r.itemName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {r.slots[0]}
                              {r.slots.length > 1 && (
                                <span className="text-muted-foreground/60">
                                  {" "}+{r.slots.length - 1} horário{r.slots.length > 2 ? "s" : ""}
                                </span>
                              )}
                              {r.category === "instrumentos" && r.quantity && (
                                <span className="font-bold text-primary/70 ml-1.5">
                                  · {r.quantity} un.
                                </span>
                              )}
                            </p>
                          </div>
                          {isOwn && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold shrink-0">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                            {initials}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {r.userName ?? r.userEmail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Hub do Administrador
// ──────────────────────────────────────────────────────────────────────────────

const AdminHub = () => {
  const navigate = useNavigate();
  const { reservations } = useReservations();

  const handleSectionChange = (section: "dashboard" | "gerenciar" | "espacos" | "instrumentos") => {
    navigate("/admin", { state: { adminSection: section } });
  };

  const { data: professors = [] } = useQuery({
    queryKey: ["professors"],
    queryFn: listProfessors,
  });
  const { data: allItems = [] } = useQuery({
    queryKey: ["allItems"],
    queryFn: fetchAllItems,
  });

  const today = new Date().toLocaleDateString("en-CA");
  const { start: weekStart, end: weekEnd } = weekRange(today);
  const weekRes = reservations.filter((r) => r.date >= weekStart && r.date <= weekEnd);
  const todayRes = reservations.filter((r) => r.date === today);
  const numEspacos = allItems.filter((i) => i.category === "espacos").length;
  const numInstrumentos = allItems.filter((i) => i.category === "instrumentos").length;
  const profAtivos = professors.filter((p) => p.ativo).length;
  const ocupacao =
    numEspacos > 0
      ? Math.min(100, Math.round((weekRes.length / (numEspacos * 5)) * 100))
      : 0;

  return (
    <AdminLayout onSectionChange={handleSectionChange}>
      <div className="p-8 space-y-8 bg-primary/[0.01] min-h-full">
        {/* Título */}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary/70 mb-1.5">
            Bem-vindo, Administrador
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-base text-slate-600 mt-1 max-w-2xl font-medium">
            Resumo de desempenho e monitoramento do sistema de reservas institucional.
          </p>
          <div className="absolute -left-8 top-0 bottom-0 w-1 bg-primary/20 rounded-r-full" />
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <CalendarBlank weight="bold" className="w-6 h-6 text-primary" />,
              label: "Reservas esta semana",
              value: weekRes.length,
              sub: `${todayRes.length} hoje`,
            },
            {
              icon: <UsersThree weight="bold" className="w-6 h-6 text-primary" />,
              label: "Professores ativos",
              value: profAtivos,
              sub: `${professors.length} cadastrados`,
            },
            {
              icon: <TrendUp weight="bold" className="w-6 h-6 text-primary" />,
              label: "Taxa de ocupação",
              value: `${ocupacao}%`,
              sub: "espaços esta semana",
            },
          ].map((s, i) => (
            <div
              key={s.label}
              className="bg-white border border-primary/10 rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/[0.03] rounded-bl-[4rem] -mr-6 -mt-6 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 shadow-sm border border-primary/5">
                {s.icon}
              </div>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tighter leading-none">{s.value}</p>
              <p className="text-[15px] font-bold text-slate-800 mt-3.5 leading-tight">{s.label}</p>
              <p className="text-[12px] font-bold text-primary/60 mt-1.5 uppercase tracking-wider">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Acesso rápido */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Acesso Rápido</h2>
            <span className="text-[11px] font-bold text-primary/60 uppercase tracking-widest">Ações do Sistema</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <ChartBar weight="bold" className="w-6 h-6 text-primary" />,
                title: "Painel Administrativo",
                desc: "Relatórios diários, semanais e exportação em PDF de todas as reservas.",
                path: "/admin",
                stat: (
                  <span className="font-bold">
                    <span className="text-primary">{todayRes.length}</span> hoje ·{" "}
                    <span className="text-primary">{reservations.length}</span> total
                  </span>
                ),
              },
              {
                icon: <Buildings weight="bold" className="w-6 h-6 text-primary" />,
                title: "Espaços",
                desc: "Gestão completa de salas de aula, laboratórios e auditórios.",
                path: "/espacos",
                stat: (
                  <span className="font-bold">
                    <span className="text-primary">{numEspacos}</span> cadastrados
                  </span>
                ),
              },
              {
                icon: <Cube weight="bold" className="w-6 h-6 text-primary" />,
                title: "Equipamentos",
                desc: "Monitoramento e controle de projetores, notebooks e microfones.",
                path: "/instrumentos",
                stat: (
                  <span className="font-bold">
                    <span className="text-primary">{numInstrumentos}</span> disponíveis
                  </span>
                ),
              },
            ].map((card, i) => (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="bg-white border border-primary/10 rounded-2xl p-7 text-left hover:border-primary/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group flex flex-col relative"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <PhArrowRight weight="bold" className="w-4 h-4 text-primary" />
                </div>

                {/* Ícone */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 shadow-sm border border-primary/5">
                  {card.icon}
                </div>

                {/* Texto */}
                <p className="text-[17px] font-bold text-slate-900 leading-tight mb-2 group-hover:text-primary transition-colors">{card.title}</p>
                <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">{card.desc}</p>

                {/* Stat */}
                <div className="border-t border-primary/5 mt-5 pt-4 text-[13px] text-slate-400">
                  {card.stat}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Home — roteia pelo role
// ──────────────────────────────────────────────────────────────────────────────

const Home = () => {
  const { user } = useAuth();
  if (user?.role === "admin") return <AdminHub />;
  return <ProfessorHub />;
};

export default Home;
