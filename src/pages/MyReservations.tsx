import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useReservations } from "@/contexts/ReservationContext";
import { Reservation } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarX, Package } from "lucide-react";

// Representa um item da lista: reserva isolada ou grupo (espaço + instrumentos)
type DisplayItem =
  | { type: "single"; reservation: Reservation }
  | { type: "group"; groupId: string; space: Reservation; instruments: Reservation[] };

const MyReservations = () => {
  const navigate = useNavigate();
  const { reservations, cancelReservation, cancelGroup } = useReservations();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = reservations.filter((r) => r.date >= today);
  const past = reservations.filter((r) => r.date < today);
  const displayed = tab === "upcoming" ? upcoming : past;

  // Agrupa reservas pelo groupId
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
      if (r.category === "espacos") {
        g.space = r;
      } else {
        g.instruments.push(r);
      }
      if (!seenGroups.has(r.groupId)) {
        seenGroups.add(r.groupId);
        result.push({ type: "group", groupId: r.groupId, space: g.space!, instruments: g.instruments });
      }
    });

    return result;
  }, [displayed]);

  const statusBadge = (
    <Badge
      variant="outline"
      className={
        tab === "upcoming"
          ? "border-available text-available shrink-0"
          : "border-muted-foreground text-muted-foreground shrink-0"
      }
    >
      {tab === "upcoming" ? "Confirmada" : "Concluída"}
    </Badge>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-4">Minhas Reservas</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
          <button
            onClick={() => setTab("upcoming")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "upcoming" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setTab("past")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "past" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Passadas
          </button>
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-16">
            <CalendarX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma reserva encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => {
              // Reserva isolada (instrumento ou espaço sem instrumentos)
              if (item.type === "single") {
                const r = item.reservation;
                return (
                  <div
                    key={r.id}
                    className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{r.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.date.split("-").reverse().join("/")} · {r.slots.join(", ")}
                      </p>
                      {r.quantity && (
                        <p className="text-xs text-muted-foreground">Qtd: {r.quantity}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge}
                      {tab === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-unavailable border-unavailable hover:bg-unavailable/5"
                          onClick={() => cancelReservation(r.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }

              // Reserva agrupada: espaço + instrumentos
              const { groupId, space, instruments } = item;
              // Pode ser que o space ainda não esteja preenchido no Map ao percorrer
              // Buscamos direto das reservas para garantir
              const spaceR = displayed.find((r) => r.groupId === groupId && r.category === "espacos");
              const instRs = displayed.filter((r) => r.groupId === groupId && r.category === "instrumentos");
              if (!spaceR) return null;

              return (
                <div key={groupId} className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Cabeçalho: espaço */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{spaceR.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {spaceR.date.split("-").reverse().join("/")} · {spaceR.slots.join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge}
                      {tab === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-unavailable border-unavailable hover:bg-unavailable/5"
                          onClick={() => cancelGroup(groupId)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Instrumentos reservados junto */}
                  {instRs.length > 0 && (
                    <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Instrumentos
                        </span>
                      </div>
                      {instRs.map((inst) => (
                        <div key={inst.id} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{inst.itemName}</span>
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
