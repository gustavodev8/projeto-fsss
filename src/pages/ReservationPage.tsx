import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { fetchItemById, fetchHorarios, fetchItems } from "@/services/items";
import { createReservationRpc } from "@/services/reservations";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, PackagePlus, Check, Building2, Package, AlertCircle } from "lucide-react";
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
  const [submitError, setSubmitError] = useState("");
  const [imgError, setImgError] = useState(false);

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
    setSubmitError("");
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
    if (!item || !date || selectedSlots.length === 0) return;
    if (!user?.id) {
      setSubmitError("Sessão expirada. Faça login novamente.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const groupId =
        !isInstrumento && selectedInstruments.length > 0 ? crypto.randomUUID() : undefined;

      const mainResult = await createReservationRpc({
        usuarioId: user.id,
        itemId: item.id,
        data: dateStr,
        horarioLabels: selectedSlots,
        quantidade: isInstrumento ? quantity : 1,
        grupoId: groupId ?? null,
      });

      if (mainResult.error) {
        setSubmitError(mainResult.error);
        setSubmitting(false);
        return;
      }

      for (const si of selectedInstruments) {
        const instResult = await createReservationRpc({
          usuarioId: user.id,
          itemId: si.id,
          data: dateStr,
          horarioLabels: selectedSlots,
          quantidade: si.quantity,
          grupoId: groupId ?? null,
        });
        if (instResult.error) {
          setSubmitError(`Espaço reservado, mas houve um erro com um equipamento: ${instResult.error}`);
          await reload();
          setSubmitting(false);
          return;
        }
      }

      await reload();
      setSubmitting(false);
      setShowSuccess(true);
    } catch (err) {
      setSubmitError("Ocorreu um erro inesperado. Tente novamente.");
      setSubmitting(false);
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            {isInstrumento
              ? <Package className="w-6 h-6 text-muted-foreground/40" />
              : <Building2 className="w-6 h-6 text-muted-foreground/40" />
            }
          </div>
          <p className="text-sm text-muted-foreground">
            {id ? "Carregando..." : "Item não encontrado."}
          </p>
        </div>
      </div>
    );
  }

  const canConfirm = !!date && selectedSlots.length > 0 && !submitting;

  const groupByBreaks = (slots: TimeSlot[]): TimeSlot[][] => {
    const groups: TimeSlot[][] = [[]];
    for (const s of slots) {
      if (s.isBreak) groups.push([]);
      else groups[groups.length - 1].push(s);
    }
    return groups.filter((g) => g.length > 0);
  };

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
          "relative text-xs py-3 px-2 rounded-lg border transition-colors duration-100 text-center",
          isOccupied &&
            "bg-muted/40 text-muted-foreground/50 border-border cursor-not-allowed",
          !isDisabled &&
            !isSelected &&
            "border-border text-foreground bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
          isSelected && "bg-primary text-primary-foreground border-primary shadow-sm"
        )}
      >
        <span className="block leading-tight font-medium tabular-nums">{slot.label}</span>
        {isOccupied && (
          <span className="block text-[9px] mt-0.5 font-normal">Indisponível</span>
        )}
        {isInstrumento && !isOccupied && reserved > 0 && (
          <span className="block text-[9px] mt-0.5 font-normal opacity-70">
            {remaining} restante{remaining !== 1 ? "s" : ""}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="max-w-[1100px] mx-auto px-6 py-6">

        {/* Back */}
        <button
          onClick={() => navigate(`/${category}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar
        </button>

        <div className="grid lg:grid-cols-2 gap-6 items-stretch">

          {/* ── LEFT: item info ── */}
          <div className="flex flex-col h-full">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
              <div className="relative h-72 bg-muted overflow-hidden shrink-0">
                {imgError || !item.image ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    {isInstrumento
                      ? <Package className="w-14 h-14 text-muted-foreground/20" />
                      : <Building2 className="w-14 h-14 text-muted-foreground/20" />
                    }
                  </div>
                ) : (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <h1 className="text-xl font-bold text-foreground">{item.name}</h1>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: date picker ── */}
          <div className="flex flex-col h-full">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full flex flex-col">
              <div className="mb-6">
                <Label className="text-base font-bold text-foreground block">Escolha a data</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">Selecione o dia para verificar a disponibilidade</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border border-border/50 p-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setSelectedSlots([]);
                    setQuantity(1);
                    setSelectedInstruments([]);
                    setSubmitError("");
                  }}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  locale={ptBR}
                  className="w-full"
                  classNames={{
                    months: "w-full",
                    month: "w-full space-y-4",
                    table: "w-full border-collapse",
                    head_row: "flex w-full justify-between mb-2",
                    head_cell: "text-muted-foreground rounded-md w-10 font-bold text-[10px] uppercase tracking-widest text-center",
                    row: "flex w-full justify-between mt-2",
                    cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                    day: cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-10 w-10 sm:h-12 sm:w-12 p-0 font-medium aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
                    ),
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md shadow-primary/20",
                    day_today: "bg-accent text-accent-foreground font-bold",
                    nav_button: cn(
                      buttonVariants({ variant: "outline" }),
                      "h-8 w-8 bg-background p-0 border-border hover:bg-muted transition-colors"
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── FULL WIDTH: time slots ── */}
        {date && allSlots.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-8 mt-6 shadow-sm">
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground">Horários Disponíveis</h2>
                <p className="text-xs text-muted-foreground mt-1">Selecione os períodos desejados para sua reserva</p>
              </div>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 relative">
                {/* Vertical Divider (Desktop) */}
                <div className="hidden md:block absolute left-1/2 top-2 bottom-2 w-px bg-border/40 -translate-x-1/2" />

                {/* Turno Manhã */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Turno Manhã</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {groupByBreaks(morningSlots).map((group, gi) => (
                      <div key={gi} className="space-y-2">
                        {gi > 0 && (
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-[1px] flex-1 bg-border/40" />
                            <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">Intervalo</span>
                            <div className="h-[1px] flex-1 bg-border/40" />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {group.map((slot) => (
                            <SlotButton key={slot.label} slot={slot} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Turno Tarde */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Turno Tarde</h3>
                  </div>

                  <div className="space-y-4">
                    {groupByBreaks(afternoonSlots).map((group, gi) => (
                      <div key={gi} className="space-y-2">
                        {gi > 0 && (
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-[1px] flex-1 bg-border/40" />
                            <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">Intervalo</span>
                            <div className="h-[1px] flex-1 bg-border/40" />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {group.map((slot) => (
                            <SlotButton key={slot.label} slot={slot} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend & Selection Count */}
              <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full border border-border bg-card shadow-inner" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Disponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Selecionado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted/60" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ocupado</span>
                  </div>
                </div>

                {selectedSlots.length > 0 && (
                  <div className="bg-primary/5 border border-primary/10 px-4 py-2 rounded-lg">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {selectedSlots.length} {selectedSlots.length > 1 ? "Horários Selecionados" : "Horário Selecionado"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FULL WIDTH: quantity (instruments) ── */}
        {isInstrumento && date && selectedSlots.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mt-6">
            <Label className="text-sm font-semibold mb-1 block">Quantidade</Label>
            <p className="text-xs text-muted-foreground mb-3">
              {availableQtyForSelection}{" "}
              {availableQtyForSelection === 1 ? "unidade disponível" : "unidades disponíveis"}{" "}
              para os horários selecionados
            </p>
            <Input
              type="number"
              min={1}
              max={availableQtyForSelection}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Math.min(availableQtyForSelection, Number(e.target.value))))
              }
              className="w-24 font-mono"
            />
          </div>
        )}

        {/* ── FULL WIDTH: equipment addon (spaces only) ── */}
        {!isInstrumento && date && selectedSlots.length > 0 && instrumentosDb.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mt-6">
            <div className="flex items-center gap-2 mb-1">
              <PackagePlus className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">
                Deseja reservar algum equipamento?
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione equipamentos para usar no espaço reservado.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                      "flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all",
                      isUnavailable && "opacity-50 cursor-not-allowed border-border bg-muted/30",
                      !isUnavailable && !isChecked && "border-border hover:border-primary/40 cursor-pointer",
                      isChecked && "border-primary bg-primary/5 cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          isChecked ? "bg-primary border-primary" : "border-muted-foreground/40"
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
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 ml-3">
                        <span className="text-xs text-muted-foreground">Qtd:</span>
                        <Input
                          type="number"
                          min={1}
                          max={avail}
                          value={sel!.quantity}
                          onChange={(e) => updateInstrumentQty(inst.id, Number(e.target.value))}
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

      {/* Sticky confirm bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border px-6 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center sm:items-start">
              {submitError ? (
                <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {submitError}
                </div>
              ) : !date ? (
                <p className="text-sm font-medium text-muted-foreground">Selecione uma data para continuar</p>
              ) : selectedSlots.length === 0 ? (
                <p className="text-sm font-medium text-muted-foreground">Selecione pelo menos um horário</p>
              ) : (
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-sm font-bold text-foreground">
                    {format(date, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSlots.length} {selectedSlots.length === 1 ? "horário selecionado" : "horários selecionados"}
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleConfirm} 
              disabled={!canConfirm} 
              className="w-full sm:w-64 h-12 text-base font-bold shadow-lg shadow-primary/20"
            >
              {submitting ? "Processando..." : "Confirmar Reserva"}
            </Button>
          </div>
        </div>
      </div>

      {/* Success dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <CheckCircle2 className="w-12 h-12 text-available mb-2" />
            <DialogTitle className="text-xl">Reserva confirmada!</DialogTitle>
            <DialogDescription className="text-left space-y-1 mt-3 w-full">
              <span className="block">
                <strong>{isInstrumento ? "Equipamento" : "Espaço"}:</strong> {item.name}
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
                  <p className="font-semibold mb-1">Equipamentos:</p>
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
