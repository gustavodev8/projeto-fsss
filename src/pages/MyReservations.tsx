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
        result.push({ type: "group", groupId: r.groupId, space: g.space!, instruments: g.instruments });
      }
    });

    return result;
  }, [displayed]);

  const formatDate = (d: string) => d.split("-").reverse().join("/");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Minhas Reservas</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-border rounded-xl p-1 mb-8 shadow-sm">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 ${
                tab === t
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "upcoming" ? (
                <><Calendar className="w-4 h-4" /> Próximas <span className={`text-xs px-2 py-0.5 rounded-full ${tab === "upcoming" ? "bg-white/20" : "bg-muted"}`}>{upcoming.length}</span></>
              ) : (
                <><Clock className="w-4 h-4" /> Passadas <span className={`text-xs px-2 py-0.5 rounded-full ${tab === "past" ? "bg-white/20" : "bg-muted"}`}>{past.length}</span></>
              )}
            </button>
          ))}
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-20 animate-fade-in bg-white border border-border rounded-2xl border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <CalendarX className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Nenhuma reserva encontrada</p>
            <p className="text-sm text-muted-foreground">
              {tab === "upcoming" ? "Você não tem reservas futuras." : "Nenhuma reserva passada."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {displayItems.map((item) => {
              if (item.type === "single") {
                const r = item.reservation;
                return (
                  <div key={r.id} className="bg-white border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all group">
                    <div className="space-y-2 min-w-0">
                      <p className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors">{r.itemName}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary/70" />
                          {formatDate(r.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary/70" />
                          {r.slots.join(" · ")}
                        </span>
                        {r.quantity && (
                          <span className="flex items-center gap-1.5 font-bold text-primary/80">
                            <Package className="w-3.5 h-3.5" />
                            {r.quantity} un.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                        tab === "upcoming"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {tab === "upcoming" ? "✓ Confirmada" : "Concluída"}
                      </span>
                      {tab === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold text-destructive border-destructive/30 hover:bg-destructive/5 h-8 px-4 rounded-lg"
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
              const spaceR = item.space;
              const instRs = item.instruments;

              return (
                <div key={groupId} className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <p className="font-bold text-foreground text-lg truncate">{spaceR.itemName}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary/70" />
                          {formatDate(spaceR.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary/70" />
                          {spaceR.slots.join(" · ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                        tab === "upcoming"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {tab === "upcoming" ? "✓ Confirmada" : "Concluída"}
                      </span>
                      {tab === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold text-destructive border-destructive/30 hover:bg-destructive/5 h-8 px-4 rounded-lg"
                          onClick={() => cancelGroup(groupId)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>

                  {instRs.length > 0 && (
                    <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Equipamentos incluídos
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {instRs.map((inst) => (
                          <div key={inst.id} className="flex items-center justify-between bg-white/60 border border-border/50 px-3 py-2 rounded-lg">
                            <span className="text-xs font-semibold text-foreground">{inst.itemName}</span>
                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
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
