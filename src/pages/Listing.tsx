import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import { espacos, instrumentos, ReservableItem } from "@/data/mockData";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Listing = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const isEspacos = category === "espacos";
  const items: ReservableItem[] = isEspacos ? espacos : instrumentos;
  const title = isEspacos ? "Espaços" : "Instrumentos";

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/${category}/${item.id}`)}
              className="bg-card border border-border rounded-lg overflow-hidden text-left hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="font-medium text-foreground">{item.name}</span>
                <Badge
                  variant="outline"
                  className={
                    item.available
                      ? "border-available text-available"
                      : "border-unavailable text-unavailable"
                  }
                >
                  {item.available ? "Disponível" : "Indisponível"}
                </Badge>
              </div>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">
            Nenhum resultado encontrado.
          </p>
        )}
      </main>
    </div>
  );
};

export default Listing;
