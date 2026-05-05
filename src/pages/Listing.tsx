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
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-7 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Voltar
        </button>

        {/* Header da página */}
        <div className="flex items-start gap-5 mb-8">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
            {isEspacos
              ? <Building2 className="w-7 h-7 text-primary" />
              : <Package className="w-7 h-7 text-primary" />
            }
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
            <p className="text-base text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Busca + contador */}
        <div className="flex items-center gap-3 mb-7">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
          {!isLoading && (
            <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0 bg-white border border-border px-4 py-2.5 rounded-xl">
              {availableCount} disponíve{availableCount === 1 ? "l" : "is"}
            </span>
          )}
        </div>

        {/* Grid de itens */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="h-52 bg-muted" />
                <div className="p-5 flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-5 bg-muted rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-primary/10">
              {isEspacos
                ? <Building2 className="w-7 h-7 text-primary" />
                : <Package className="w-7 h-7 text-primary" />
              }
            </div>
            <p className="text-base font-medium text-foreground mb-1">Nenhum resultado encontrado</p>
            <p className="text-sm text-muted-foreground">Tente buscar com outro termo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/${category}/${item.id}`)}
                className="bg-white border border-border rounded-2xl overflow-hidden text-left hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                {/* Imagem */}
                <div className="relative overflow-hidden h-52 bg-muted">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />

                </div>

                {/* Info */}
                <div className="px-5 py-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all shrink-0" />
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
