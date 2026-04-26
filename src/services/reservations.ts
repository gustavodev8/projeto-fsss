import { supabase } from "@/lib/supabase";
import type { Reservation } from "@/types";

export async function fetchAllReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("vw_reservas_detalhadas")
    .select("*")
    .eq("status", "confirmada")
    .order("criado_em", { ascending: false });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.reserva_id as string,
    groupId: (r.grupo_id as string) ?? undefined,
    itemId: r.item_id as string,
    itemName: r.item_nome as string,
    date: r.data_reserva as string,
    slots: (r.horarios_labels as string[]) ?? [],
    quantity: (r.quantidade as number) ?? 1,
    category: r.item_categoria as "espacos" | "instrumentos",
    userName: r.usuario_nome as string,
    userEmail: r.usuario_email as string,
  }));
}

export async function createReservationRpc(params: {
  usuarioId: string;
  itemId: string;
  data: string;
  horarioLabels: string[];
  quantidade?: number;
  grupoId?: string | null;
}): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase.rpc("fn_criar_reserva", {
    p_usuario_id: params.usuarioId,
    p_item_id: params.itemId,
    p_data: params.data,
    p_horario_labels: params.horarioLabels,
    p_quantidade: params.quantidade ?? 1,
    p_grupo_id: params.grupoId ?? null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("SLOT_UNAVAILABLE:")) {
      const slot = msg.split("SLOT_UNAVAILABLE:")[1]?.trim() ?? "";
      return {
        id: null,
        error: slot
          ? `O horário "${slot}" já foi reservado. Atualize a página e escolha outro horário.`
          : "Um dos horários selecionados não está mais disponível.",
      };
    }
    if (msg.includes("ITEM_NOT_FOUND")) {
      return { id: null, error: "Este item não está mais disponível para reserva." };
    }
    return { id: null, error: msg || "Não foi possível criar a reserva. Tente novamente." };
  }
  return { id: data as string };
}

export async function fetchCancelledReservations(userEmail?: string): Promise<Reservation[]> {
  let query = supabase
    .from("vw_reservas_detalhadas")
    .select("*")
    .eq("status", "cancelada")
    .order("cancelado_em", { ascending: false });

  if (userEmail) {
    query = query.eq("usuario_email", userEmail);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((r) => ({
    id: r.reserva_id as string,
    groupId: (r.grupo_id as string) ?? undefined,
    itemId: r.item_id as string,
    itemName: r.item_nome as string,
    date: r.data_reserva as string,
    slots: (r.horarios_labels as string[]) ?? [],
    quantity: (r.quantidade as number) ?? 1,
    category: r.item_categoria as "espacos" | "instrumentos",
    userName: r.usuario_nome as string,
    userEmail: r.usuario_email as string,
    cancelledAt: r.cancelado_em as string,
  }));
}

export async function cancelReservationById(reservaId: string): Promise<void> {
  await supabase
    .from("reservas")
    .update({ status: "cancelada", cancelado_em: new Date().toISOString() })
    .eq("id", reservaId);
}

export async function cancelGroupById(grupoId: string): Promise<void> {
  await supabase
    .from("reservas")
    .update({ status: "cancelada", cancelado_em: new Date().toISOString() })
    .eq("grupo_id", grupoId);
}
