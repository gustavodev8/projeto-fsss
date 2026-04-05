import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { DoorOpen, Music } from "lucide-react";

const categories = [
  {
    key: "espacos",
    label: "Espaços",
    subtitle: "Salas, laboratórios, quadra, auditório",
    icon: DoorOpen,
    path: "/espacos",
  },
  {
    key: "instrumentos",
    label: "Instrumentos",
    subtitle: "Equipamentos, projetores, instrumentos musicais",
    icon: Music,
    path: "/instrumentos",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-12">
        {firstName && (
          <p className="text-sm text-muted-foreground text-center mb-1">
            Olá, <span className="font-medium text-foreground">{firstName}</span>
          </p>
        )}
        <h1 className="text-2xl font-bold text-foreground text-center mb-8">
          O que você deseja reservar?
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(cat.path)}
              className="bg-card border border-border rounded-lg p-8 text-left hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <cat.icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">{cat.label}</h2>
              <p className="text-sm text-muted-foreground">{cat.subtitle}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
