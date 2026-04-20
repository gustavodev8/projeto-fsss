import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchItems } from "@/services/items";
import { ArrowLeft, Search, Building2, Package, ArrowRight } from "lucide-react";

const Listing = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const isEspacos = category === "espacos";
  const cat = isEspacos ? ("espacos" as const) : ("instrumentos" as const);
  const title = isEspacos ? "Espaços" : "Equipamentos";
  const subtitle = isEspacos
    ? "Salas, laboratórios, auditórios e áreas externas disponíveis para reserva."
    : "Projetores, notebooks, microfones, caixas de som e demais equipamentos.";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", cat],
    queryFn: () => fetchItems(cat),
  });

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = filtered.filter((i) => i.available).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-5 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Voltar
        </button>

        {/* Header da página */}
        <div className="flex items-start gap-4 mb-7">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isEspacos ? "bg-violet-50" : "bg-emerald-50"}`}>
            {isEspacos
              ? <Building2 className="w-5 h-5 text-violet-600" />
              : <Package className="w-5 h-5 text-emerald-600" />
            }
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Busca + contador */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
          {!isLoading && (
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 bg-white border border-border px-3 py-2 rounded-xl">
              {availableCount} disponíve{availableCount === 1 ? "l" : "is"}
            </span>
          )}
        </div>

        {/* Grid de itens */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <div className="p-4 flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-5 bg-muted rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isEspacos ? "bg-violet-50" : "bg-emerald-50"}`}>
              {isEspacos
                ? <Building2 className="w-6 h-6 text-violet-400" />
                : <Package className="w-6 h-6 text-emerald-400" />
              }
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Nenhum resultado encontrado</p>
            <p className="text-xs text-muted-foreground">Tente buscar com outro termo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/${category}/${item.id}`)}
                className="bg-white border border-border rounded-2xl overflow-hidden text-left hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Imagem */}
                <div className="relative overflow-hidden h-44 bg-muted">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {/* Badge de disponibilidade sobre a imagem */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
                      item.available
                        ? "bg-emerald-500/90 text-white"
                        : "bg-red-500/90 text-white"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                      {item.available ? "Disponível" : "Indisponível"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Listing;
