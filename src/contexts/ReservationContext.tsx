import React, { createContext, useContext, useState, ReactNode } from "react";
import { Reservation } from "@/data/mockData";

interface ReservationContextType {
  reservations: Reservation[];
  addReservation: (r: Reservation) => void;
  cancelReservation: (id: string) => void;
  cancelGroup: (groupId: string) => void;
}

const ReservationContext = createContext<ReservationContextType | null>(null);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const addReservation = (r: Reservation) => {
    setReservations((prev) => [...prev, r]);
  };

  const cancelReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const cancelGroup = (groupId: string) => {
    setReservations((prev) => prev.filter((r) => r.groupId !== groupId));
  };

  return (
    <ReservationContext.Provider value={{ reservations, addReservation, cancelReservation, cancelGroup }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservations must be used within ReservationProvider");
  return ctx;
};
