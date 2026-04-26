import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCancelledReservations } from "@/services/reservations";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarX, Package, Clock, Calendar, Ban } from "lucide-react";

type Tab = "upcoming" | "past" | "cancelled";

type DisplayItem =
  | { type: "single"; reservation: Reservation }
  | { type: "group"; groupId: string; space: Reservation; instruments: Reservation[] };

function buildDisplayItems(list: Reservation[]): DisplayItem[] {
  const groupMap = new Map<string, { space?: Reservation; instruments: Reservation[] }>();
  const result: DisplayItem[] = [];
  const seenGroups = new Set<string>();

  list.forEach((r) => {
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

  return result.map((item) => {
    if (item.type === "group") {
      const g = groupMap.get(item.groupId);
      const mainSpace = g?.space || g?.instruments?.[0];
      if (!mainSpace) return null;
      return { ...item, space: mainSpace, instruments: g?.instruments ?? [] };
    }
    return item;
  }).filter(Boolean) as DisplayItem[];
}

const MyReservations = () => {
  const navigate = useNavigate();
  const { reservations, cancelReservation, cancelGroup } = useReservations();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");

  const today = new Date().toLocaleDateString("en-CA");
  const myReservations = reservations.filter((r) => r.userEmail === user?.email);
  const upcoming = myReservations.filter((r) => r.date >= today);
  const past = myReservations.filter((r) => r.date < today);

  const { data: cancelledRaw = [], isFetching: loadingCancelled } = useQuery({
    queryKey: ["cancelledReservations", user?.email],
    queryFn: () => fetchCancelledReservations(user?.email),
    enabled: tab === "cancelled",
  });

  const displayed = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelledRaw;

  const displayItems = useMemo(() => buildDisplayItems(displayed), [displayed]);

  const formatDate = (d: string) => {
    if (!d || !d.includes("-")) return d || "—";
    const [y, m, dNum] = d.split("-");
    return `${dNum}/${m}/${y}`;
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "upcoming", label: "Próximas", count: upcoming.length },
    { key: "past", label: "Histórico", count: past.length },
    { key: "cancelled", label: "Canceladas" },
  ];

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
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 sm:px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  tab === t.key ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    tab === t.key ? "bg-primary/10 text-primary" : "bg-slate-300/60 text-slate-500"
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loadingCancelled ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">Carregando...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayItems.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] py-20 text-center shadow-sm">
                {tab === "cancelled" ? (
                  <Ban className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                ) : (
                  <CalendarX className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                )}
                <p className="text-slate-500 font-bold">
                  {tab === "cancelled" ? "Nenhuma reserva cancelada" : "Nenhuma reserva encontrada"}
                </p>
              </div>
            ) : (
              displayItems.map((item, idx) => {
                const isGroup = item.type === "group";
                const mainRes = isGroup ? item.space : item.reservation;
                const instruments = isGroup ? item.instruments : [];
                if (!mainRes || !mainRes.itemName) return null;

                const isCancelled = tab === "cancelled";

                return (
                  <div
                    key={isGroup ? `group-${item.groupId}` : `single-${mainRes.id}-${idx}`}
                    className={`bg-white border rounded-[1.5rem] shadow-sm p-6 flex flex-col gap-4 transition-all ${
                      isCancelled
                        ? "border-rose-100 hover:border-rose-200 opacity-80"
                        : "border-slate-200 hover:shadow-lg hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-slate-900 truncate">
                            {mainRes.itemName}
                          </h2>
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                              <Ban className="w-3 h-3" /> Cancelada
                            </span>
                          )}
                        </div>

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
                          {isCancelled && mainRes.cancelledAt && (
                            <span className="text-xs text-rose-400 font-medium">
                              cancelada em {formatDate(mainRes.cancelledAt.split("T")[0])}
                            </span>
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

                    {isGroup && instruments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Incluso:</span>
                        {instruments.map((inst) => (
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
        )}
      </main>
    </div>
  );
};

export default MyReservations;
