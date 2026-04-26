import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminManage from "./AdminManage";
import { fetchItems } from "@/services/items";
import { Buildings, Cube, MagnifyingGlass, ArrowRight, ArrowSquareOut } from "@phosphor-icons/react";

type AdminSection = "dashboard" | "gerenciar" | "espacos" | "instrumentos";

const AdminListingView = ({
  category,
  onGoToReservation,
}: {
  category: "espacos" | "instrumentos";
  onGoToReservation: (cat: string, id: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const isEspacos = category === "espacos";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", category],
    queryFn: () => fetchItems(category),
  });

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = filtered.filter((i) => i.available).length;

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1.5">
            {isEspacos ? "Reservas" : "Reservas"}
          </p>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {isEspacos ? "Espaços" : "Equipamentos"}
          </h1>
          <p className="text-base font-medium text-muted-foreground mt-1">
            {isEspacos
              ? "Salas, laboratórios, auditórios e áreas externas disponíveis para reserva."
              : "Projetores, notebooks, microfones, caixas de som e demais equipamentos."}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-white border border-border rounded-xl px-4 py-2.5 shadow-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${availableCount > 0 ? "bg-emerald-400" : "bg-rose-400"}`} />
          <span className="text-sm font-bold text-foreground">{availableCount}</span>
          <span className="text-sm text-muted-foreground">disponíve{availableCount === 1 ? "l" : "is"}</span>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={`Buscar ${isEspacos ? "espaço" : "equipamento"} por nome...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl py-20 text-center">
          <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center bg-primary/8">
            {isEspacos
              ? <Buildings weight="bold" className="w-7 h-7 text-primary" />
              : <Cube weight="bold" className="w-7 h-7 text-primary" />
            }
          </div>
          <p className="text-base font-bold text-foreground mb-1">Nenhum resultado</p>
          <p className="text-sm text-muted-foreground">Tente buscar com outro termo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => onGoToReservation(category, item.id)}
              className="bg-white border border-border rounded-2xl overflow-hidden text-left hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group shadow-sm"
            >
              {/* Imagem */}
              <div className="relative h-48 bg-muted overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    {isEspacos
                      ? <Buildings weight="thin" className="w-14 h-14 text-primary/20" />
                      : <Cube weight="thin" className="w-14 h-14 text-primary/20" />
                    }
                  </div>
                )}
                {/* Badge disponibilidade */}
                <div className={`absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                  item.available
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                  {item.available ? "Disponível" : "Indisponível"}
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-3.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                  )}
                  {item.totalUnits !== undefined && (
                    <p className="text-xs font-semibold text-primary/70 mt-1">{item.availableUnits ?? item.totalUnits} / {item.totalUnits} un. disponíveis</p>
                  )}
                </div>
                <ArrowSquareOut weight="bold" className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initial: AdminSection =
    (location.state as { adminSection?: string } | null)?.adminSection as AdminSection || "dashboard";

  const [activeSection, setActiveSection] = useState<AdminSection>(initial);

  // Sincroniza a seção ativa com o estado da navegação (sidebar)
  useEffect(() => {
    const state = location.state as { adminSection?: AdminSection } | null;
    if (state?.adminSection && state.adminSection !== activeSection) {
      setActiveSection(state.adminSection);
    }
  }, [location.state, activeSection]);

  const handleGoToReservation = (cat: string, id: string) => {
    navigate(`/${cat}/${id}`);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard": return <AdminDashboard />;
      case "gerenciar": return <AdminManage />;
      case "espacos":   return <AdminListingView category="espacos" onGoToReservation={handleGoToReservation} />;
      case "instrumentos": return <AdminListingView category="instrumentos" onGoToReservation={handleGoToReservation} />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanel;
