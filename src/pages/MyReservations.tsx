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

  const formatDate = (d: string) => {
    if (!d || !d.includes("-")) return d || "—";
    const [y, m, dNum] = d.split("-");
    return `${dNum}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary mb-6 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Minhas Reservas</h1>
          <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
            {(["upcoming", "past"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                  tab === t ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "upcoming" ? "Próximas" : "Histórico"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {displayItems.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-20 text-center">
              <CalendarX className="w-10 h-10 text-slate-200 mx-auto mb-3" />
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
                     className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md hover:border-primary/20 transition-all group">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info Central */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                          {mainRes.itemName}
                        </h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                          tab === "upcoming" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          {tab === "upcoming" ? "Confirmada" : "Concluída"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-primary/60" />
                          <span className="text-sm font-semibold">{formatDate(mainRes.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-primary/60" />
                          <span className="text-sm font-semibold">{mainRes.slots?.join(" · ")}</span>
                        </div>
                        {!isGroup && mainRes.quantity && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Package className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-sm font-bold text-slate-700">{mainRes.quantity} un.</span>
                          </div>
                        )}
                      </div>

                      {/* Lista Simples de Equipamentos (se houver) */}
                      {isGroup && instruments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Incluso:</span>
                          {instruments.map(inst => (
                            <div key={inst.id} className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-600">{inst.itemName}</span>
                              <span className="text-[10px] font-black text-primary/80">{inst.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Botão de Ação */}
                    {tab === "upcoming" && (
                      <div className="shrink-0">
                        <Button
                          variant="ghost"
                          className="w-full md:w-auto text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-[11px] uppercase tracking-widest h-9 px-5 rounded-xl border border-transparent hover:border-rose-100 transition-all"
                          onClick={() => isGroup ? cancelGroup(item.groupId) : cancelReservation(mainRes.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
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
