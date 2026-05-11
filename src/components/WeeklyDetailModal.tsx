import { useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useReservations } from "@/contexts/ReservationContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Reservation } from "@/types";

interface WeeklyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CategoryBadge = ({ category }: { category: Reservation["category"] }) =>
  category === "espacos" ? (
    <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
      Espaço
    </span>
  ) : (
    <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      Equipamento
    </span>
  );

export function WeeklyDetailModal({ open, onOpenChange }: WeeklyDetailModalProps) {
  const { reservations } = useReservations();

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const grouped = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      if (r.cancelledAt) continue;
      const date = parseISO(r.date);
      if (!isWithinInterval(date, { start: weekStart, end: weekEnd })) continue;
      const existing = map.get(r.date) ?? [];
      map.set(r.date, [...existing, r]);
    }
    return map;
  }, [reservations, weekStart, weekEnd]);

  const todayStr = format(today, "yyyy-MM-dd");
  const hasAny = grouped.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
            Detalhamento da Semana
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(weekStart, "d 'de' MMMM", { locale: ptBR })}
            {" – "}
            {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 mt-3 pr-1">
          {!hasAny ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma reserva ativa esta semana.
            </div>
          ) : (
            <div className="space-y-5 pb-3">
              {weekDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayItems = grouped.get(dateStr);
                if (!dayItems?.length) return null;

                const isToday = dateStr === todayStr;

                return (
                  <section key={dateStr}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-primary/70 capitalize">
                        {format(day, "EEEE", { locale: ptBR })}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {format(day, "d 'de' MMMM", { locale: ptBR })}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          Hoje
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {dayItems.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-gray-50/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                {r.itemName}
                              </span>
                              <CategoryBadge category={r.category} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {r.userName ?? r.userEmail ?? "—"}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {r.slots.map((slot) => (
                                <span
                                  key={slot}
                                  className="text-[11px] font-medium bg-white border border-border text-foreground px-2 py-0.5 rounded-md font-mono"
                                >
                                  {slot}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
