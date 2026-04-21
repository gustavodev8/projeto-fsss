import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReservations } from "@/contexts/ReservationContext";
import { listProfessors } from "@/services/users";
import { fetchAllItems } from "@/services/items";
import { DoorOpen, Package, CalendarDays } from "lucide-react";
import {
  CalendarBlank,
  UsersThree,
  TrendUp,
  ChartBar,
  Buildings,
  Cube,
  ArrowRight as PhArrowRight,
} from "@phosphor-icons/react";

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

  const today = new Date().toISOString().split("T")[0];
  const myUpcoming = reservations.filter(
    (r) => r.userEmail === user?.email && r.date >= today
  );

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {professorCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(cat.path)}
              className="bg-white border border-border rounded-xl p-6 min-h-[140px] text-left transition-all duration-[180ms] hover:-translate-y-1 shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] group cursor-pointer"
              style={{ borderLeftColor: '#1A56DB', borderLeftWidth: '4px' }}
            >
              <div className="w-10 h-10 rounded-full bg-[#E8F0FE] flex items-center justify-center mb-4">
                <cat.icon className="w-5 h-5 text-[#1A56DB]" strokeWidth={2.5} />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">{cat.label}</h2>
              <p className="text-sm text-muted-foreground">{cat.subtitle}</p>
            </button>
          ))}
        </div>

        {myUpcoming.length > 0 && (
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
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

  const { data: professors = [] } = useQuery({
    queryKey: ["professors"],
    queryFn: listProfessors,
  });
  const { data: allItems = [] } = useQuery({
    queryKey: ["allItems"],
    queryFn: fetchAllItems,
  });

  const today = new Date().toISOString().split("T")[0];
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
    <AdminLayout>
      <div className="p-8 space-y-7">
        {/* Título */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Bem-vindo, Administrador
          </p>
          <h1 className="text-[1.65rem] font-bold text-foreground">Visão geral</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumo de desempenho do sistema de reservas.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
              className="bg-white border border-border rounded-xl p-6 hover:shadow-sm transition-shadow duration-200"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-5">
                {s.icon}
              </div>
              <p className="text-4xl font-bold text-foreground tracking-tight leading-none">{s.value}</p>
              <p className="text-[15px] font-semibold text-foreground mt-3 leading-tight">{s.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Acesso rápido */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-foreground">Acesso rápido</h2>
            <span className="text-sm text-muted-foreground">Selecione um módulo para começar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: <ChartBar weight="bold" className="w-6 h-6 text-primary" />,
                title: "Painel Administrativo",
                desc: "Relatórios diários, semanais e exportação em PDF.",
                path: "/admin",
                stat: (
                  <span>
                    <span className="font-semibold text-foreground">{todayRes.length}</span> hoje ·{" "}
                    <span className="font-semibold text-foreground">{reservations.length}</span> total
                  </span>
                ),
              },
              {
                icon: <Buildings weight="bold" className="w-6 h-6 text-primary" />,
                title: "Espaços",
                desc: "Salas de aula, laboratórios e auditórios.",
                path: "/espacos",
                stat: (
                  <span>
                    <span className="font-semibold text-foreground">{numEspacos}</span> cadastrados
                  </span>
                ),
              },
              {
                icon: <Cube weight="bold" className="w-6 h-6 text-primary" />,
                title: "Equipamentos",
                desc: "Projetores, notebooks, microfones e demais itens.",
                path: "/instrumentos",
                stat: (
                  <span>
                    <span className="font-semibold text-foreground">{numInstrumentos}</span>{" "}
                    disponíveis
                  </span>
                ),
              },
            ].map((card, i) => (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="bg-white border border-border rounded-xl p-6 text-left hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group flex flex-col"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Ícone + seta na mesma linha */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <PhArrowRight
                    weight="bold"
                    className="w-4 h-4 text-muted-foreground/25 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all duration-150"
                  />
                </div>

                {/* Texto */}
                <p className="text-[15px] font-semibold text-foreground leading-tight">{card.title}</p>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed flex-1">{card.desc}</p>

                {/* Stat */}
                <div className="border-t border-border/70 mt-4 pt-3 text-sm text-muted-foreground">
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
