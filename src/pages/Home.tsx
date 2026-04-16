import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useReservations } from "@/contexts/ReservationContext";
import { DoorOpen, Package, LayoutDashboard, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        {/* Saudação */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-0.5">
            {greeting()}, <span className="font-medium text-foreground">{user?.name}</span>
          </p>
          <h1 className="text-2xl text-foreground">O que deseja reservar?</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione uma categoria para verificar disponibilidade e realizar sua reserva.
          </p>
        </div>

        {/* Cards de categoria */}
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

        {/* Reservas próximas do professor */}
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
                      {r.slots.length > 1 && ` +${r.slots.length - 1} horário${r.slots.length > 2 ? "s" : ""}`}
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
  const { user } = useAuth();
  const { reservations } = useReservations();

  const today = new Date().toISOString().split("T")[0];
  const todayCount = reservations.filter((r) => r.date === today).length;
  const totalCount = reservations.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-0.5">
            Bem-vindo, <span className="font-medium text-foreground">{user?.name}</span>
          </p>
          <h1 className="text-2xl text-foreground">Painel Institucional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesso rápido às ferramentas administrativas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card: Painel Admin */}
          <button
            onClick={() => navigate("/admin")}
            className="bg-card border border-border rounded p-6 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Painel Administrativo</h2>
            <p className="text-sm text-muted-foreground">
              Visualize relatórios e baixe PDFs de reservas.
            </p>
            {(todayCount > 0 || totalCount > 0) && (
              <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{todayCount}</span> hoje
                <span className="text-border">·</span>
                <span className="font-medium text-foreground">{totalCount}</span> total
              </div>
            )}
          </button>

          {/* Card: Espaços */}
          <button
            onClick={() => navigate("/espacos")}
            className="bg-card border border-border rounded p-6 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <DoorOpen className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Espaços</h2>
            <p className="text-sm text-muted-foreground">
              Salas, laboratórios, auditórios e áreas externas.
            </p>
          </button>

          {/* Card: Equipamentos */}
          <button
            onClick={() => navigate("/instrumentos")}
            className="bg-card border border-border rounded p-6 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Equipamentos</h2>
            <p className="text-sm text-muted-foreground">
              Projetores, notebooks, microfones e caixas de som.
            </p>
          </button>
        </div>
      </main>
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
