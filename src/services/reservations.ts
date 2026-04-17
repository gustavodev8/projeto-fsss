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
}): Promise<string | null> {
  const { data, error } = await supabase.rpc("fn_criar_reserva", {
    p_usuario_id: params.usuarioId,
    p_item_id: params.itemId,
    p_data: params.data,
    p_horario_labels: params.horarioLabels,
    p_quantidade: params.quantidade ?? 1,
    p_grupo_id: params.grupoId ?? null,
  });

  if (error) {
    console.error("createReservationRpc:", error);
    return null;
  }
  return data as string;
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
