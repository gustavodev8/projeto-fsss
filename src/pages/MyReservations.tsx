import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarX, Package, Clock, Calendar, CheckCircle2, ChevronRight } from "lucide-react";

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
      if (!groupMap.has(r.groupId)) groupMap.set(r.groupId, { instruments: [] });
      const g = groupMap.get(r.groupId)!;
      if (r.category === "espacos") g.space = r;
      else g.instruments.push(r);
      
      if (!seenGroups.has(r.groupId)) {
        seenGroups.add(r.groupId);
        result.push({ type: "group", groupId: r.groupId, space: {} as Reservation, instruments: [] });
      }
    });

    // Preenche os dados dos grupos corretamente
    return result.map(item => {
      if (item.type === "group") {
        const g = groupMap.get(item.groupId)!;
        return { ...item, space: g.space || g.instruments[0], instruments: g.instruments };
      }
      return item;
    });
  }, [displayed]);

  const formatDate = (d: string) => {
    if (!d || !d.includes("-")) return d;
    const [y, m, dNum] = d.split("-");
    return `${dNum}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-6 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Minhas Reservas</h1>
            <p className="text-slate-500 text-base mt-1 font-medium">Gerencie seus agendamentos institucionais.</p>
          </div>
          
          <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 shadow-sm">
            {(["upcoming", "past"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                  tab === t
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "upcoming" ? "Próximas" : "Histórico"}
              </button>
            ))}
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <CalendarX className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Sem reservas</h3>
            <p className="text-slate-500 text-sm mt-1">Suas novas reservas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {displayItems.map((item, idx) => {
              const isGroup = item.type === "group";
              const mainRes = isGroup ? item.space : item.reservation;
              const instruments = isGroup ? item.instruments : [];

              if (!mainRes || !mainRes.itemName) return null;

              return (
                <div 
                  key={isGroup ? `group-${item.groupId}` : `single-${mainRes.id}-${idx}`} 
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Lado Esquerdo */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            tab === "upcoming" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            {tab === "upcoming" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            {tab === "upcoming" ? "Confirmada" : "Concluída"}
                          </span>
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">
                          {mainRes.itemName}
                        </h2>

                        <div className="flex flex-wrap items-center gap-y-3 gap-x-5">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                              <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Data</p>
                              <p className="text-base font-bold text-slate-800">{formatDate(mainRes.date)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                              <Clock className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Horários</p>
                              <p className="text-base font-bold text-slate-800">{mainRes.slots?.join(" · ") || "—"}</p>
                            </div>
                          </div>

                          {!isGroup && mainRes.quantity && (
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                                <Package className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-tighter text-primary/60">Qtd</p>
                                <p className="text-base font-bold text-slate-800">{mainRes.quantity} un.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lado Direito */}
                      <div className="flex flex-row lg:flex-col items-center justify-end gap-2 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {tab === "upcoming" && (
                          <Button
                            variant="outline"
                            className="w-full lg:w-36 h-11 border-2 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-bold text-xs uppercase tracking-widest transition-all rounded-xl shadow-sm"
                            onClick={() => isGroup ? cancelGroup(item.groupId) : cancelReservation(mainRes.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="w-full lg:w-36 h-11 text-slate-400 hover:text-primary font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                          Ver Detalhes <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Itens Adicionais */}
                  {isGroup && instruments.length > 0 && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Itens Incluídos</span>
                        <div className="h-px flex-1 bg-slate-200/60" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {instruments.map((inst) => (
                          <div key={inst.id} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm group/inst hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/inst:bg-primary/5 transition-colors">
                                <Package className="w-5 h-5 text-slate-400 group-hover/inst:text-primary" />
                              </div>
                              <span className="text-base font-bold text-slate-700">{inst.itemName}</span>
                            </div>
                            <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-lg group-hover/inst:bg-primary/10 group-hover/inst:text-primary transition-colors">
                              {inst.quantity} un.
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyReservations;
