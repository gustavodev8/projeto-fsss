import React, { createContext, useContext, useState, ReactNode } from "react";
import { Reservation } from "@/data/mockData";

interface ReservationContextType {
  reservations: Reservation[];
  addReservation: (r: Reservation) => void;
  cancelReservation: (id: string) => void;
}

const ReservationContext = createContext<ReservationContextType | null>(null);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "r1",
      itemId: "e1",
      itemName: "Sala 12",
      date: "2026-04-07",
      slots: ["07:50 – 08:40", "08:40 – 09:30"],
      category: "espacos",
    },
    {
      id: "r2",
      itemId: "i2",
      itemName: "Violão Nº 3",
      date: "2026-04-03",
      slots: ["10:35 – 11:25"],
      quantity: 2,
      category: "instrumentos",
    },
  ]);

  const addReservation = (r: Reservation) => {
    setReservations((prev) => [...prev, r]);
  };

  const cancelReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <ReservationContext.Provider value={{ reservations, addReservation, cancelReservation }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservations must be used within ReservationProvider");
  return ctx;
};
