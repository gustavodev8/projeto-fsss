import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import { espacos, instrumentos, timeSlots, ReservableItem } from "@/data/mockData";
import { useReservations } from "@/contexts/ReservationContext";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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

const ReservationPage = () => {
  const { category, id } = useParams<{ category: string; id: string }>();
  const navigate = useNavigate();
  const { addReservation } = useReservations();

  const allItems = category === "espacos" ? espacos : instrumentos;
  const item: ReservableItem | undefined = allItems.find((i) => i.id === id);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock some occupied slots
  const occupiedSlots = useMemo(() => {
    if (!date) return new Set<string>();
    const day = date.getDay();
    if (day === 1) return new Set(["07:50 – 08:40", "08:40 – 09:30"]);
    if (day === 3) return new Set(["13:55 – 14:45", "14:45 – 15:35"]);
    return new Set<string>();
  }, [date]);

  const toggleSlot = (label: string) => {
    setSelectedSlots((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleConfirm = () => {
    if (!item || !date || selectedSlots.length === 0) return;
    addReservation({
      id: `r-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      date: format(date, "yyyy-MM-dd"),
      slots: selectedSlots,
      quantity: category === "instrumentos" ? quantity : undefined,
      category: category as "espacos" | "instrumentos",
    });
    setShowSuccess(true);
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <p className="text-center mt-12 text-muted-foreground">Item não encontrado.</p>
      </div>
    );
  }

  const isInstrumento = category === "instrumentos";
  const maxQty = item.availableUnits ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/${category}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Item summary */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
          <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
          <div className="p-4">
            <h1 className="text-xl font-bold text-foreground">{item.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </div>
        </div>

        {/* Date picker */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <Label className="text-base font-semibold mb-3 block">Escolha a data</Label>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setSelectedSlots([]);
            }}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            locale={ptBR}
            className="p-3 pointer-events-auto mx-auto"
          />
        </div>

        {/* Time slots */}
        {date && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <Label className="text-base font-semibold mb-3 block">Escolha o horário</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {timeSlots.map((slot) => {
                const isOccupied = occupiedSlots.has(slot.label);
                const isSelected = selectedSlots.includes(slot.label);
                const isDisabled = slot.isBreak || isOccupied;

                return (
                  <button
                    key={slot.label}
                    disabled={isDisabled}
                    onClick={() => toggleSlot(slot.label)}
                    className={cn(
                      "font-mono text-xs py-2.5 px-3 rounded-md border transition-all text-center",
                      isDisabled && "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60",
                      !isDisabled && !isSelected && "border-available text-available hover:bg-available/5",
                      isSelected && "bg-primary text-primary-foreground border-primary"
                    )}
                  >
                    {slot.label}
                    {slot.isBreak && (
                      <span className="block text-[10px] mt-0.5 opacity-70">Intervalo</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity (instruments only) */}
        {isInstrumento && date && selectedSlots.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <Label className="text-base font-semibold mb-1 block">Quantidade</Label>
            <p className="text-xs text-muted-foreground mb-3">
              {maxQty} {maxQty === 1 ? "unidade disponível" : "unidades disponíveis"}
            </p>
            <Input
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(maxQty, Number(e.target.value))))}
              className="w-24 font-mono"
            />
          </div>
        )}

        {/* Confirm */}
        <Button
          onClick={handleConfirm}
          disabled={!date || selectedSlots.length === 0}
          className="w-full"
          size="lg"
        >
          Confirmar Reserva
        </Button>
      </main>

      {/* Success modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader className="items-center">
            <CheckCircle2 className="w-12 h-12 text-available mb-2" />
            <DialogTitle className="text-xl">Reserva confirmada!</DialogTitle>
            <DialogDescription className="text-left space-y-1 mt-3">
              <span className="block"><strong>Item:</strong> {item.name}</span>
              <span className="block"><strong>Data:</strong> {date ? format(date, "dd/MM/yyyy") : ""}</span>
              <span className="block"><strong>Horários:</strong> {selectedSlots.join(", ")}</span>
              {isInstrumento && <span className="block"><strong>Quantidade:</strong> {quantity}</span>}
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
