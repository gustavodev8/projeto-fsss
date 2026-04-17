import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Reservation } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAllReservations,
  cancelReservationById,
  cancelGroupById,
} from "@/services/reservations";

interface ReservationContextType {
  reservations: Reservation[];
  loading: boolean;
  reload: () => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  cancelGroup: (groupId: string) => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | null>(null);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchAllReservations();
    setReservations(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const cancelReservation = async (id: string) => {
    await cancelReservationById(id);
    await reload();
  };

  const cancelGroup = async (groupId: string) => {
    await cancelGroupById(groupId);
    await reload();
  };

  return (
    <ReservationContext.Provider value={{ reservations, loading, reload, cancelReservation, cancelGroup }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservations must be used within ReservationProvider");
  return ctx;
};
