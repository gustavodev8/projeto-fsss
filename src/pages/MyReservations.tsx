import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarX, Package, Clock, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type DisplayItem =
  | { type: "single"; reservation: Reservation }
  | { type: "group"; groupId: string; space: Reservation; instruments: Reservation[] };

const MyReservations = () => {
  const navigate = useNavigate();
  const { reservations, cancelReservation, cancelGroup } = useReservations();
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const today = new Date().toLocaleDateString("en-CA");
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
      if (!groupMap.has(r.groupId)) groupMap.set(r.groupId, { instruments: [] });
      const g = groupMap.get(r.groupId)!;
      if (r.category === "espacos") g.space = r;
      else g.instruments.push(r);
      
      if (!seenGroups.has(r.groupId)) {
        seenGroups.add(r.groupId);
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

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (d: string) => {
    if (!d || !d.includes("-")) return d || "—";
    const [y, m, dNum] = d.split("-");
    return `${dNum}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary mb-6 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Minhas Reservas</h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base">Gestão de agendamentos institucionais.</p>
          </div>
          
          <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            {(["upcoming", "past"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                  tab === t ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "upcoming" ? "Próximas" : "Histórico"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {displayItems.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] py-20 text-center shadow-sm">
              <CalendarX className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Nenhuma reserva encontrada</p>
            </div>
          ) : (
            displayItems.map((item, idx) => {
              const isGroup = item.type === "group";
              const mainRes = isGroup ? item.space : item.reservation;
              const instruments = isGroup ? item.instruments : [];
              const groupId = isGroup ? item.groupId : `single-${mainRes.id}-${idx}`;
              const isOpen = openGroups[groupId] || false;

              if (!mainRes || !mainRes.itemName) return null;

              return (
                <div key={groupId} 
                     className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm p-5 sm:p-6 hover:shadow-lg hover:border-primary/20 transition-all flex flex-col gap-4 overflow-visible min-h-fit">
                  
                  {/* Título e Cancelar */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                        {mainRes.itemName}
                      </h2>
                      
                      {/* Dados: Data e Hora */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary/70" />
                          <span className="text-xs sm:text-sm font-bold">{formatDate(mainRes.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary/70" />
                          <span className="text-xs sm:text-sm font-bold">{mainRes.slots?.join(" · ")}</span>
                        </div>
                      </div>
                    </div>

                    {tab === "upcoming" && (
                      <Button
                        variant="ghost"
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest h-9 px-3 sm:px-4 rounded-xl border border-rose-100/30 transition-all shrink-0"
                        onClick={() => isGroup ? cancelGroup(item.groupId) : cancelReservation(mainRes.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>

                  {/* Área Colapsável para Instrumentos */}
                  {isGroup && instruments.length > 0 && (
                    <Collapsible open={isOpen} onOpenChange={() => toggleGroup(groupId)} className="w-full">
                      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                         <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                               {isOpen ? <><ChevronUp className="w-3 h-3 mr-1" /> Ocultar itens</> : <><ChevronDown className="w-3 h-3 mr-1" /> + {instruments.length} itens inclusos</>}
                            </Button>
                         </CollapsibleTrigger>
                         {!isOpen && (
                            <div className="flex -space-x-2 overflow-hidden">
                               {instruments.slice(0, 3).map((inst, i) => (
                                  <div key={i} className="inline-block h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-sm">
                                     <Package className="w-3 h-3 text-slate-400" />
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>

                      <CollapsibleContent className="space-y-3 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipamentos da reserva:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {instruments.map(inst => (
                            <div key={inst.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
                              <span className="text-xs font-bold text-slate-700">{inst.itemName}</span>
                              <span className="text-[10px] font-black text-primary bg-white px-2 py-0.5 rounded-md border border-slate-200">{inst.quantity} un.</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Quantidade única (instrumentos avulsos) */}
                  {!isGroup && mainRes.quantity && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                        <Package className="w-3.5 h-3.5 text-primary/60" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantidade:</span>
                        <span className="text-sm font-black text-slate-900">{mainRes.quantity} un.</span>
                    </div>
                  )}
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
