import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
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

  const today = new Date().toISOString().split("T")[0];
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
        result.push({ type: "group", groupId: r.groupId, space: g.space!, instruments: g.instruments });
      }
    });

    return result;
  }, [displayed]);

  const formatDate = (d: string) => d.split("-").reverse().join("/");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-5 py-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Voltar
        </button>

        <h1 className="text-xl font-bold text-foreground mb-5">Minhas Reservas</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-border rounded-xl p-1 mb-6">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                tab === t
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "upcoming" ? (
                <><Calendar className="w-3.5 h-3.5" /> Próximas <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "upcoming" ? "bg-white/20" : "bg-muted"}`}>{upcoming.length}</span></>
              ) : (
                <><Clock className="w-3.5 h-3.5" /> Passadas <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "past" ? "bg-white/20" : "bg-muted"}`}>{past.length}</span></>
              )}
            </button>
          ))}
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <CalendarX className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Nenhuma reserva encontrada</p>
            <p className="text-xs text-muted-foreground">
              {tab === "upcoming" ? "Você não tem reservas futuras." : "Nenhuma reserva passada."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {displayItems.map((item) => {
              if (item.type === "single") {
                const r = item.reservation;
                return (
                  <div key={r.id} className="bg-white border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-shadow">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{r.itemName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(r.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {r.slots[0]}{r.slots.length > 1 && ` +${r.slots.length - 1}`}
                        </span>
                        {r.quantity && <span>Qtd: {r.quantity}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        tab === "upcoming"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {tab === "upcoming" ? "Confirmada" : "Concluída"}
                      </span>
                      {tab === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5 h-7 px-2.5 rounded-lg"
                          onClick={() => cancelReservation(r.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }

              const { groupId } = item;
              const spaceR = displayed.find((r) => r.groupId === groupId && r.category === "espacos");
              const instRs = displayed.filter((r) => r.groupId === groupId && r.category === "instrumentos");
              if (!spaceR) return null;

              return (
                <div key={groupId} className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{spaceR.itemName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(spaceR.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {spaceR.slots[0]}{spaceR.slots.length > 1 && ` +${spaceR.slots.length - 1}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        tab === "upcoming"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {tab === "upcoming" ? "Confirmada" : "Concluída"}
                      </span>
                      {tab === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5 h-7 px-2.5 rounded-lg"
                          onClick={() => cancelGroup(groupId)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>

                  {instRs.length > 0 && (
                    <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Equipamentos incluídos
                        </span>
                      </div>
                      {instRs.map((inst) => (
                        <div key={inst.id} className="flex items-center justify-between">
                          <span className="text-xs text-foreground">{inst.itemName}</span>
                          <span className="text-xs text-muted-foreground">
                            {inst.quantity} unidade{(inst.quantity ?? 1) > 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
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
