import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchHorarios } from "@/services/items";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarX, Package, Clock, Calendar } from "lucide-react";

type DisplayItem =
  | { type: "single"; reservation: Reservation }
  | { type: "group"; groupId: string; space: Reservation; instruments: Reservation[] };

const MyReservations = () => {
  const navigate = useNavigate();
  const { reservations, cancelReservation, cancelGroup } = useReservations();
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data: allSlots = [] } = useQuery({
    queryKey: ["horarios"],
    queryFn: fetchHorarios,
  });

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  const myReservations = reservations.filter((r) => r.userEmail === user?.email);
  const upcoming = myReservations.filter((r) => r.date >= today);
  const past = myReservations.filter((r) => r.date < today);
  const displayed = tab === "upcoming" ? upcoming : past;

  const displayItems = useMemo<DisplayItem[]>(() => {
    const groupMap = new Map<string, { space?: Reservation; instruments: Reservation[] }>();
    const tempResult: DisplayItem[] = [];
    const seenGroups = new Set<string>();

    displayed.forEach((r) => {
      if (!r.groupId) {
        tempResult.push({ type: "single", reservation: r });
        return;
      }
      if (!groupMap.has(r.groupId)) groupMap.set(r.groupId, { instruments: [] });
      const g = groupMap.get(r.groupId)!;
      if (r.category === "espacos") g.space = r;
      else g.instruments.push(r);
      
      if (!seenGroups.has(r.groupId)) {
        seenGroups.add(r.groupId);
        tempResult.push({ type: "group", groupId: r.groupId, space: {} as Reservation, instruments: [] });
      }
    });

    const result = tempResult.map(item => {
      if (item.type === "group") {
        const g = groupMap.get(item.groupId);
        const mainSpace = g?.space || (g?.instruments && g.instruments[0]);
        if (!mainSpace) return null;
        return { ...item, space: mainSpace, instruments: g?.instruments || [] };
      }
      return item;
    }).filter(Boolean) as DisplayItem[];

    // Sorting logic
    return result.sort((a, b) => {
      const resA = a.type === "group" ? a.space : a.reservation;
      const resB = b.type === "group" ? b.space : b.reservation;

      // 1. Compare Date
      if (resA.date !== resB.date) {
        return tab === "upcoming"
          ? resA.date.localeCompare(resB.date) // Ascending for future
          : resB.date.localeCompare(resA.date); // Descending for past
      }

      // 2. Compare Time (if dates are equal)
      const idxA = allSlots.findIndex(s => s.label === resA.slots[0]);
      const idxB = allSlots.findIndex(s => s.label === resB.slots[0]);
      return idxA - idxB;
    });
  }, [displayed, allSlots, tab]);

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
            <p className="text-slate-500 font-medium">Gestão de agendamentos institucionais.</p>
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
              if (!mainRes || !mainRes.itemName) return null;

              return (
                <div key={isGroup ? `group-${item.groupId}` : `single-${mainRes.id}-${idx}`} 
                     className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm p-6 hover:shadow-lg hover:border-primary/20 transition-all flex flex-col gap-4">
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-slate-900 truncate">
                        {mainRes.itemName}
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-primary/60" />
                          <span className="text-sm font-semibold">{formatDate(mainRes.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-primary/60" />
                          <span className="text-sm font-semibold">{mainRes.slots?.join(" · ")}</span>
                        </div>
                        {!isGroup && mainRes.quantity && (
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-primary/60" />
                            <span className="text-sm font-bold text-slate-700">{mainRes.quantity} un.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {tab === "upcoming" && (
                      <Button
                        variant="ghost"
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl border border-rose-100/30 transition-all shrink-0"
                        onClick={() => isGroup ? cancelGroup(item.groupId) : cancelReservation(mainRes.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>

                  {/* Seção de Instrumentos Inclusos - Estática */}
                  {isGroup && instruments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Incluso:</span>
                      {instruments.map(inst => (
                        <div key={inst.id} className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60 shadow-sm">
                          <span className="text-[11px] font-bold text-slate-600">{inst.itemName}</span>
                          <span className="text-[10px] font-black text-primary/80 bg-primary/5 px-1 rounded">{inst.quantity}</span>
                        </div>
                      ))}
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
