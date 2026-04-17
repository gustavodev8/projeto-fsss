import { supabase } from "@/lib/supabase";
import type { ReservableItem, TimeSlot } from "@/types";

function mapItem(r: Record<string, unknown>): ReservableItem {
  return {
    id: r.id as string,
    name: r.nome as string,
    description: (r.descricao as string) ?? "",
    category: r.categoria as "espacos" | "instrumentos",
    image: (r.imagem_url as string) ?? "",
    available: r.disponivel as boolean,
    totalUnits: (r.total_unidades as number) ?? undefined,
  };
}

export async function fetchItems(
  categoria: "espacos" | "instrumentos"
): Promise<ReservableItem[]> {
  const { data, error } = await supabase
    .from("itens")
    .select("*")
    .eq("categoria", categoria)
    .eq("disponivel", true)
    .order("nome");

  if (error || !data) return [];
  return data.map(mapItem);
}

export async function fetchItemById(id: string): Promise<ReservableItem | null> {
  const { data, error } = await supabase
    .from("itens")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapItem(data);
}

export async function fetchHorarios(): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from("horarios")
    .select("*")
    .order("ordem");

  if (error || !data) return [];
  return data.map((r) => ({
    label: r.label as string,
    start: r.hora_inicio as string,
    end: r.hora_fim as string,
    isBreak: r.is_intervalo as boolean,
  }));
}
