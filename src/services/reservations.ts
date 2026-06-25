import { apiGet, apiPost } from "@/lib/api";
import type { Reservation } from "@/types";

export async function fetchAllReservations(): Promise<Reservation[]> {
  try {
    const data = await apiGet<{ reservations: Reservation[] }>("/reservations?scope=all");
    return data.reservations ?? [];
  } catch {
    return [];
  }
}

export async function createReservationRpc(params: {
  usuarioId: string;
  itemId: string;
  data: string;
  horarioLabels: string[];
  quantidade?: number;
  grupoId?: string | null;
}): Promise<{ id: string | null; error?: string }> {
  try {
    const data = await apiPost<{ reservation: { id: string } }>("/reservations", {
      user_id: params.usuarioId,
      item_id: params.itemId,
      date: params.data,
      time_slots: params.horarioLabels,
      quantity: params.quantidade ?? 1,
      group_id: params.grupoId ?? null,
    });
    return { id: data.reservation?.id ?? null };
  } catch (e: any) {
    const msg = e?.message ?? "";
    if (msg.includes("SLOT_UNAVAILABLE:")) {
      const slot = msg.split("SLOT_UNAVAILABLE:")[1]?.trim() ?? "";
      return {
        id: null,
        error: slot
          ? `O horário "${slot}" já foi reservado. Atualize a página e escolha outro horário.`
          : "Um dos horários selecionados não está mais disponível.",
      };
    }
    if (msg.includes("Item not found")) {
      return { id: null, error: "Este item não está mais disponível para reserva." };
    }
    return { id: null, error: msg || "Não foi possível criar a reserva. Tente novamente." };
  }
}

export async function fetchCancelledReservations(userEmail?: string): Promise<Reservation[]> {
  try {
    const suffix = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : "";
    const data = await apiGet<{ reservations: Reservation[] }>(`/reservations?scope=cancelled${suffix}`);
    return data.reservations ?? [];
  } catch {
    return [];
  }
}

export async function cancelReservationById(reservaId: string): Promise<void> {
  await apiPost(`/reservations/${reservaId}/cancel`);
}

export async function cancelGroupById(grupoId: string): Promise<void> {
  await apiPost(`/reservations/groups/${grupoId}/cancel`);
}
