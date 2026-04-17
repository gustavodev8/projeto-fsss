import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchItemById, fetchHorarios, fetchItems } from "@/services/items";
import { createReservationRpc } from "@/services/reservations";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Clock, Sun, Sunset, PackagePlus, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { TimeSlot } from "@/types";

interface InstrumentSelection {
  id: string;
  quantity: number;
}

const ReservationPage = () => {
  const { category, id } = useParams<{ category: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reservations, reload } = useReservations();

  const isInstrumento = category === "instrumentos";

  const { data: item } = useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItemById(id!),
    enabled: !!id,
  });

  const { data: allSlots = [] } = useQuery({
    queryKey: ["horarios"],
    queryFn: fetchHorarios,
  });

  const { data: instrumentosDb = [] } = useQuery({
    queryKey: ["items", "instrumentos"],
    queryFn: () => fetchItems("instrumentos"),
    enabled: !isInstrumento,
  });

  const morningSlots = allSlots.slice(0, 7);
  const afternoonSlots = allSlots.slice(7);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentSelection[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reservedQtyForSlot = useMemo(() => {
    if (!date || !item) return {} as Record<string, number>;
    const dateStr = format(date, "yyyy-MM-dd");
    const result: Record<string, number> = {};
    reservations
      .filter((r) => r.itemId === item.id && r.date === dateStr)
      .forEach((r) =>
        r.slots.forEach((s) => {
          result[s] = (result[s] ?? 0) + (r.quantity ?? 1);
        })
      );
    return result;
  }, [date, item, reservations]);

  const instReservedQty = useMemo(() => {
    if (!date) return {} as Record<string, Record<string, number>>;
    const dateStr = format(date, "yyyy-MM-dd");
    const result: Record<string, Record<string, number>> = {};
    reservations
      .filter((r) => r.category === "instrumentos" && r.date === dateStr)
      .forEach((r) => {
        if (!result[r.itemId]) result[r.itemId] = {};
        r.slots.forEach((s) => {
          result[r.itemId][s] = (result[r.itemId][s] ?? 0) + (r.quantity ?? 1);
        });
      });
    return result;
  }, [date, reservations]);

  const instAvailable = useMemo(() => {
    const result: Record<string, number> = {};
    instrumentosDb.forEach((inst) => {
      if (selectedSlots.length === 0) {
        result[inst.id] = inst.totalUnits ?? 1;
        return;
      }
      const slotQty = instReservedQty[inst.id] ?? {};
      const min = Math.min(
        ...selectedSlots.map((s) => (inst.totalUnits ?? 1) - (slotQty[s] ?? 0))
      );
      result[inst.id] = Math.max(0, min);
    });
    return result;
  }, [selectedSlots, instReservedQty, instrumentosDb]);

  const occupiedSlots = useMemo(() => {
    if (!date || !item) return new Set<string>();
    const occupied = new Set<string>();
    Object.entries(reservedQtyForSlot).forEach(([slot, qty]) => {
      if (!isInstrumento || qty >= (item.totalUnits ?? 1)) {
        occupied.add(slot);
      }
    });
    return occupied;
  }, [reservedQtyForSlot, isInstrumento, item, date]);

  const availableQtyForSelection = useMemo(() => {
    if (!item || selectedSlots.length === 0) return item?.totalUnits ?? 1;
    const total = item.totalUnits ?? 1;
    const min = Math.min(
      ...selectedSlots.map((s) => total - (reservedQtyForSlot[s] ?? 0))
    );
    return Math.max(0, min);
  }, [selectedSlots, reservedQtyForSlot, item]);

  const toggleSlot = (label: string) => {
    setSelectedSlots((prev) => {
      const next = prev.includes(label)
        ? prev.filter((s) => s !== label)
        : [...prev, label];
      setQuantity((q) => {
        const total = item?.totalUnits ?? 1;
        const min =
          next.length === 0
            ? total
            : Math.min(...next.map((s) => total - (reservedQtyForSlot[s] ?? 0)));
        return Math.min(q, Math.max(1, min));
      });
      setSelectedInstruments((prev) =>
        prev.map((si) => {
          const inst = instrumentosDb.find((i) => i.id === si.id);
          if (!inst) return si;
          const slotQty = instReservedQty[si.id] ?? {};
          const avail =
            next.length === 0
              ? (inst.totalUnits ?? 1)
              : Math.max(
                  0,
                  Math.min(...next.map((s) => (inst.totalUnits ?? 1) - (slotQty[s] ?? 0)))
                );
          return { ...si, quantity: Math.min(si.quantity, Math.max(1, avail)) };
        })
      );
      return next;
    });
  };

  const toggleInstrument = (instId: string) => {
    setSelectedInstruments((prev) =>
      prev.some((si) => si.id === instId)
        ? prev.filter((si) => si.id !== instId)
        : [...prev, { id: instId, quantity: 1 }]
    );
  };

  const updateInstrumentQty = (instId: string, val: number) => {
    setSelectedInstruments((prev) =>
      prev.map((si) =>
        si.id === instId
          ? { ...si, quantity: Math.max(1, Math.min(instAvailable[instId] ?? 1, val)) }
          : si
      )
    );
  };

  const handleConfirm = async () => {
    if (!item || !date || selectedSlots.length === 0 || !user?.id) return;
    setSubmitting(true);

    const dateStr = format(date, "yyyy-MM-dd");
    const groupId =
      !isInstrumento && selectedInstruments.length > 0 ? crypto.randomUUID() : undefined;

    await createReservationRpc({
      usuarioId: user.id,
      itemId: item.id,
      data: dateStr,
      horarioLabels: selectedSlots,
      quantidade: isInstrumento ? quantity : 1,
      grupoId: groupId ?? null,
    });

    for (const si of selectedInstruments) {
      await createReservationRpc({
        usuarioId: user.id,
        itemId: si.id,
        data: dateStr,
        horarioLabels: selectedSlots,
        quantidade: si.quantity,
        grupoId: groupId ?? null,
      });
    }

    await reload();
    setSubmitting(false);
    setShowSuccess(true);
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <p className="text-center mt-12 text-muted-foreground">
          {id ? "Carregando..." : "Item não encontrado."}
        </p>
      </div>
    );
  }

  const canConfirm = !!date && selectedSlots.length > 0 && !submitting;

  const SlotButton = ({ slot }: { slot: TimeSlot }) => {
    const isOccupied = occupiedSlots.has(slot.label);
    const isSelected = selectedSlots.includes(slot.label);
    const isDisabled = slot.isBreak || isOccupied;
    const reserved = reservedQtyForSlot[slot.label] ?? 0;
    const remaining = (item!.totalUnits ?? 1) - reserved;

    if (slot.isBreak) {
      return (
        <div className="col-span-3 flex items-center gap-2 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-1">
            Intervalo
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      );
    }

    return (
      <button
        disabled={isDisabled}
        onClick={() => toggleSlot(slot.label)}
        className={cn(
<<<<<<< Updated upstream
          "relative font-mono text-xs py-3 px-2 rounded-lg border-2 transition-all duration-150 text-center font-medium",
          isOccupied && "bg-muted/50 text-muted-foreground border-border cursor-not-allowed",
          !isDisabled && !isSelected && "border-available/60 text-available bg-available/5 hover:bg-available/10 hover:border-available",
          isSelected && "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
=======
          "relative text-xs py-3 px-2 rounded border transition-colors duration-100 text-center",
          isOccupied &&
            "bg-muted/40 text-muted-foreground/50 border-border cursor-not-allowed",
          !isDisabled &&
            !isSelected &&
            "border-border text-foreground bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
          isSelected && "bg-primary text-primary-foreground border-primary"
>>>>>>> Stashed changes
        )}
      >
        <span className="block leading-tight">{slot.label}</span>
        {isOccupied && (
          <span className="block text-[9px] mt-0.5 opacity-60 font-sans font-normal">Esgotado</span>
        )}
        {isInstrumento && !isOccupied && reserved > 0 && (
          <span className="block text-[9px] mt-0.5 font-sans font-normal opacity-80">
            {remaining} restante{remaining !== 1 ? "s" : ""}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/${category}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
          <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
          <div className="p-4">
            <h1 className="text-xl font-bold text-foreground">{item.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <Label className="text-base font-semibold mb-4 block">Escolha a data</Label>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setSelectedSlots([]);
                setQuantity(1);
                setSelectedInstruments([]);
              }}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </div>
        </div>

<<<<<<< Updated upstream
        {/* Time slots */}
        {date && (
          <div className="bg-card border border-border rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-5">
              <Label className="text-base font-semibold">Escolha o horário</Label>
=======
        {date && allSlots.length > 0 && (
          <div className="bg-card border border-border rounded p-5 mb-6">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
              <Label className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Horários disponíveis
              </Label>
>>>>>>> Stashed changes
              {selectedSlots.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {selectedSlots.length} selecionado{selectedSlots.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

<<<<<<< Updated upstream
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manhã</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {morningSlots.map((slot) => <SlotButton key={slot.label} slot={slot} />)}
=======
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
                Manhã
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {morningSlots.map((slot) => (
                  <SlotButton key={slot.label} slot={slot} />
                ))}
>>>>>>> Stashed changes
              </div>
            </div>

            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-1">
                Almoço · 12:20 – 13:00
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div>
<<<<<<< Updated upstream
              <div className="flex items-center gap-1.5 mb-3">
                <Sunset className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tarde</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {afternoonSlots.map((slot) => <SlotButton key={slot.label} slot={slot} />)}
=======
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
                Tarde
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {afternoonSlots.map((slot) => (
                  <SlotButton key={slot.label} slot={slot} />
                ))}
>>>>>>> Stashed changes
              </div>
            </div>

            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-available bg-available/5" />
                <span className="text-[11px] text-muted-foreground">Disponível</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-[11px] text-muted-foreground">Selecionado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-border bg-muted/50" />
                <span className="text-[11px] text-muted-foreground">Indisponível</span>
              </div>
            </div>
          </div>
        )}

        {isInstrumento && date && selectedSlots.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <Label className="text-base font-semibold mb-1 block">Quantidade</Label>
            <p className="text-xs text-muted-foreground mb-3">
              {availableQtyForSelection}{" "}
              {availableQtyForSelection === 1
                ? "unidade disponível"
                : "unidades disponíveis"}{" "}
              para os horários selecionados
            </p>
            <Input
              type="number"
              min={1}
              max={availableQtyForSelection}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(1, Math.min(availableQtyForSelection, Number(e.target.value)))
                )
              }
              className="w-24 font-mono"
            />
          </div>
        )}

        {!isInstrumento && date && selectedSlots.length > 0 && instrumentosDb.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <PackagePlus className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">
                Deseja reservar algum instrumento?
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione equipamentos para usar no espaço reservado.
            </p>

            <div className="space-y-2">
              {instrumentosDb.map((inst) => {
                const avail = instAvailable[inst.id] ?? 0;
                const sel = selectedInstruments.find((si) => si.id === inst.id);
                const isChecked = !!sel;
                const isUnavailable = avail <= 0;

                return (
                  <div
                    key={inst.id}
                    onClick={() => !isUnavailable && toggleInstrument(inst.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border-2 px-4 py-3 transition-all",
                      isUnavailable &&
                        "opacity-50 cursor-not-allowed border-border bg-muted/30",
                      !isUnavailable &&
                        !isChecked &&
                        "border-border hover:border-primary/40 cursor-pointer",
                      isChecked && "border-primary bg-primary/5 cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          isChecked
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/40"
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{inst.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isUnavailable
                            ? "Esgotado para os horários selecionados"
                            : `${avail} unidade${avail !== 1 ? "s" : ""} disponível${avail !== 1 ? "is" : ""}`}
                        </p>
                      </div>
                    </div>

                    {isChecked && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 ml-3"
                      >
                        <span className="text-xs text-muted-foreground">Qtd:</span>
                        <Input
                          type="number"
                          min={1}
                          max={avail}
                          value={sel!.quantity}
                          onChange={(e) =>
                            updateInstrumentQty(inst.id, Number(e.target.value))
                          }
                          className="w-16 h-8 font-mono text-sm text-center"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto">
          {canConfirm && (
            <p className="text-xs text-muted-foreground text-center mb-2">
              {format(date!, "dd/MM/yyyy")} · {selectedSlots.length} horário
              {selectedSlots.length > 1 ? "s" : ""}
              {isInstrumento && ` · ${quantity} unidade${quantity > 1 ? "s" : ""}`}
              {!isInstrumento &&
                selectedInstruments.length > 0 &&
                ` · ${selectedInstruments.length} instrumento${selectedInstruments.length > 1 ? "s" : ""}`}
            </p>
          )}
          <Button onClick={handleConfirm} disabled={!canConfirm} className="w-full" size="lg">
            {submitting ? "Salvando..." : "Confirmar Reserva"}
          </Button>
        </div>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <CheckCircle2 className="w-12 h-12 text-available mb-2" />
            <DialogTitle className="text-xl">Reserva confirmada!</DialogTitle>
            <DialogDescription className="text-left space-y-1 mt-3 w-full">
              <span className="block">
                <strong>Espaço:</strong> {item.name}
              </span>
              <span className="block">
                <strong>Data:</strong> {date ? format(date, "dd/MM/yyyy") : ""}
              </span>
              <span className="block">
                <strong>Horários:</strong> {selectedSlots.join(", ")}
              </span>
              {isInstrumento && (
                <span className="block">
                  <strong>Quantidade:</strong> {quantity}
                </span>
              )}
              {!isInstrumento && selectedInstruments.length > 0 && (
                <div className="pt-1 mt-1 border-t border-border">
                  <p className="font-semibold mb-1">Instrumentos:</p>
                  {selectedInstruments.map((si) => {
                    const inst = instrumentosDb.find((i) => i.id === si.id);
                    return inst ? (
                      <span key={si.id} className="block text-sm">
                        {inst.name} — {si.quantity} unidade{si.quantity > 1 ? "s" : ""}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate("/")} className="w-full mt-2">
            Voltar ao início
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationPage;
