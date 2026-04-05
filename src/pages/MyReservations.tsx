import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useReservations } from "@/contexts/ReservationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarX } from "lucide-react";

const MyReservations = () => {
  const navigate = useNavigate();
  const { reservations, cancelReservation } = useReservations();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = reservations.filter((r) => r.date >= today);
  const past = reservations.filter((r) => r.date < today);
  const displayed = tab === "upcoming" ? upcoming : past;

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

        {displayed.length === 0 ? (
          <div className="text-center py-16">
            <CalendarX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma reserva encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((r) => (
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
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      tab === "upcoming"
                        ? "border-available text-available"
                        : "border-muted-foreground text-muted-foreground"
                    }
                  >
                    {tab === "upcoming" ? "Confirmada" : "Concluída"}
                  </Badge>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyReservations;
