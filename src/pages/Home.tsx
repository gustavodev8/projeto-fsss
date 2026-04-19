import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AdminHeader from "@/components/AdminHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useReservations } from "@/contexts/ReservationContext";
import { listProfessors } from "@/services/users";
import { fetchAllItems } from "@/services/items";
import {
  DoorOpen,
  Package,
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  ArrowRight,
} from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-0.5">
            {greeting()},{" "}
            <span className="font-medium text-foreground">{user?.name}</span>
          </p>
          <h1 className="text-2xl text-foreground">O que deseja reservar?</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione uma categoria para verificar disponibilidade e realizar sua reserva.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {professorCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(cat.path)}
              className="bg-card border border-border rounded p-6 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <cat.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">{cat.label}</h2>
              <p className="text-sm text-muted-foreground">{cat.subtitle}</p>
            </button>
          ))}
        </div>

        {myUpcoming.length > 0 && (
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Suas próximas reservas
                </h2>
              </div>
              <button
                onClick={() => navigate("/minhas-reservas")}
                className="text-xs text-primary hover:underline font-medium"
              >
                Ver todas
              </button>
            </div>
            <div className="divide-y divide-border">
              {myUpcoming.slice(0, 3).map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.itemName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.date.split("-").reverse().join("/")} · {r.slots[0]}
                      {r.slots.length > 1 &&
                        ` +${r.slots.length - 1} horário${r.slots.length > 2 ? "s" : ""}`}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded border border-available/50 text-available font-medium">
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
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Título */}
        <div className="border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Bem-vindo, Administrador
          </p>
          <h1 className="text-2xl font-bold text-foreground">Painel Institucional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse rapidamente as ferramentas administrativas do sistema de reservas FSSS.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <CalendarDays className="w-4 h-4" />, label: "Reservas Esta Semana", value: weekRes.length },
            { icon: <Users className="w-4 h-4" />, label: "Professores Ativos", value: profAtivos },
            { icon: <Building2 className="w-4 h-4" />, label: "Taxa de Ocupação", value: `${ocupacao}%` },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-border rounded p-5">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                {s.icon}
                <span className="text-xs font-semibold uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Acesso rápido */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Acesso rápido</h2>
            <span className="text-xs text-muted-foreground">Selecione um módulo para começar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="bg-white border border-border rounded p-5 text-left hover:border-foreground/20 hover:shadow-sm transition-all group relative"
            >
              <ArrowRight className="w-4 h-4 text-muted-foreground absolute top-4 right-4 group-hover:text-foreground transition-colors" />
              <LayoutDashboard className="w-7 h-7 text-muted-foreground mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">Painel Administrativo</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visualize relatórios diários, semanais e baixe PDFs das reservas.
              </p>
              <div className="border-t border-border mt-4 pt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{todayRes.length}</span> hoje
                </span>
                <span>
                  <span className="font-semibold text-foreground">{reservations.length}</span> total
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate("/espacos")}
              className="bg-white border border-border rounded p-5 text-left hover:border-foreground/20 hover:shadow-sm transition-all group relative"
            >
              <ArrowRight className="w-4 h-4 text-muted-foreground absolute top-4 right-4 group-hover:text-foreground transition-colors" />
              <Building2 className="w-7 h-7 text-muted-foreground mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">Espaços</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Salas de aula, laboratórios, auditórios e áreas externas.
              </p>
              <div className="border-t border-border mt-4 pt-3 text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{numEspacos}</span> cadastrados
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate("/instrumentos")}
              className="bg-white border border-border rounded p-5 text-left hover:border-foreground/20 hover:shadow-sm transition-all group relative"
            >
              <ArrowRight className="w-4 h-4 text-muted-foreground absolute top-4 right-4 group-hover:text-foreground transition-colors" />
              <Package className="w-7 h-7 text-muted-foreground mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">Equipamentos</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Projetores, notebooks, microfones, caixas de som e demais itens.
              </p>
              <div className="border-t border-border mt-4 pt-3 text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{numInstrumentos}</span> disponíveis
                </span>
              </div>
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© 2026 FSSS — Fundação Social Santa Sé</p>
          <p className="text-xs text-muted-foreground">Sistema Interno de Reservas · v1.0</p>
        </div>
      </footer>
    </div>
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
