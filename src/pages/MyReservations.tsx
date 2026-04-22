import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarX, Package, Clock, Calendar, CheckCircle2 } from "lucide-react";

type DisplayItem =
  | { type: "single"; reservation: Reservation }
  | { type: "group"; groupId: string; space: Reservation; instruments: Reservation[] };

const MyReservations = () => {
  const navigate = useNavigate();
  const { reservations, cancelReservation, cancelGroup } = useReservations();
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  const myReservations = reservations.filter((r) => r.userEmail === user?.email);
  const upcoming = myReservations.filter((r) => r.date >= today);
  const past = myReservations.filter((r) => r.date < today);
  const displayed = tab === "upcoming" ? upcoming : past;

  const displayItems = useMemo<DisplayItem[]>(() => {
    const groupMap = new Map<string, { space?: Reservation; instruments: Reservation[] }>();
    const result: DisplayItem[] = [];
    const seenGroups = new Set<string>();

    displayed.forEach((r) => {
      if (!r.groupId) {
        result.push({ type: "single", reservation: r });
        return;
      }
      
      if (!groupMap.has(r.groupId)) {
        groupMap.set(r.groupId, { instruments: [] });
      }
      
      const g = groupMap.get(r.groupId)!;
      if (r.category === "espacos") g.space = r;
      else g.instruments.push(r);
      
      if (!seenGroups.has(r.groupId)) {
        seenGroups.add(r.groupId);
        // Marcamos para processar depois de popular o groupMap
        result.push({ type: "group", groupId: r.groupId, space: {} as Reservation, instruments: [] });
      }
    });

    return result.map(item => {
      if (item.type === "group") {
        const g = groupMap.get(item.groupId);
        const mainSpace = g?.space || (g?.instruments && g.instruments[0]);
        if (!mainSpace) return null;
        return { ...item, space: mainSpace, instruments: g?.instruments || [] };
      }
      return item;
    }).filter(Boolean) as DisplayItem[];
  }, [displayed]);

  const formatDate = (d: string) => {
    if (!d || !d.includes("-")) return d || "—";
    const [y, m, dNum] = d.split("-");
    return `${dNum}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-6 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para o início
        </button>

        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Minhas Reservas</h1>
          <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
            {(["upcoming", "past"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                  tab === t ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "upcoming" ? "Próximas" : "Histórico"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {displayItems.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-24 text-center">
              <CalendarX className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">Nenhuma reserva encontrada</p>
            </div>
          ) : (
            displayItems.map((item, idx) => {
              const isGroup = item.type === "group";
              const mainRes = isGroup ? item.space : item.reservation;
              const instruments = isGroup ? item.instruments : [];
              if (!mainRes || !mainRes.itemName) return null;

              return (
                <div key={isGroup ? `group-${item.groupId}` : `single-${mainRes.id}-${idx}`} 
                     className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:border-primary/20 transition-all group">
                  
                  {/* Header do Card */}
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h2 className="text-lg font-extrabold text-slate-900">{mainRes.itemName}</h2>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      tab === "upcoming" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {tab === "upcoming" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {tab === "upcoming" ? "Confirmada" : "Concluída"}
                    </span>
                  </div>

                  {/* Grid de Informações */}
                  <div className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                      
                      {/* Bloco 1: Data */}
                      <div className="p-5 flex items-center gap-4 group/item hover:bg-slate-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 leading-none mb-1">Data</p>
                          <p className="text-base font-bold text-slate-800">{formatDate(mainRes.date)}</p>
                        </div>
                      </div>

                      {/* Bloco 2: Horários */}
                      <div className="p-5 flex items-center gap-4 group/item hover:bg-slate-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 leading-none mb-1">Horários</p>
                          <p className="text-base font-bold text-slate-800 truncate">{mainRes.slots?.join(" · ") || "—"}</p>
                        </div>
                      </div>

                      {/* Bloco 3: Quantidade ou Categoria */}
                      <div className="p-5 flex items-center gap-4 group/item hover:bg-slate-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 leading-none mb-1">
                            {mainRes.category === "espacos" ? "Tipo" : "Quantidade"}
                          </p>
                          <p className="text-base font-bold text-slate-800">
                            {mainRes.category === "espacos" ? "Espaço Físico" : `${mainRes.quantity || 1} unidades`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {isGroup && instruments.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+ {instruments.length} Equipamento{instruments.length > 1 ? "s" : ""}</span>
                      </div>
                    ) : (
                      <div />
                    )}

                    {tab === "upcoming" && (
                      <Button
                        variant="ghost"
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs uppercase tracking-widest h-9 px-6 rounded-xl transition-all"
                        onClick={() => isGroup ? cancelGroup(item.groupId) : cancelReservation(mainRes.id)}
                      >
                        Cancelar Reserva
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default MyReservations;
