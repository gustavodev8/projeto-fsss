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
    .eq("disponivel", true)
    .single();

  if (error || !data) return null;
  return mapItem(data);
}

export async function fetchAllItems(): Promise<ReservableItem[]> {
  const { data, error } = await supabase
    .from("itens")
    .select("*")
    .eq("disponivel", true)
    .order("categoria")
    .order("nome");

  if (error || !data) return [];
  return data.map(mapItem);
}

export async function createItem(params: {
  adminId: string;
  nome: string;
  descricao: string;
  categoria: "espacos" | "instrumentos";
  imagemUrl?: string;
  totalUnidades?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("fn_criar_item", {
    p_admin_id: params.adminId,
    p_nome: params.nome,
    p_descricao: params.descricao,
    p_categoria: params.categoria,
    p_imagem_url: params.imagemUrl || null,
    p_total_unidades: params.totalUnidades ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteItem(
  adminId: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("fn_deletar_item", {
    p_admin_id: adminId,
    p_item_id: id,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function forceDeleteItem(
  adminId: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("fn_forcar_deletar_item", {
    p_admin_id: adminId,
    p_item_id: id,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateItem(params: {
  adminId: string;
  id: string;
  nome: string;
  descricao: string;
  imagemUrl?: string;
  totalUnidades?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("fn_atualizar_item", {
    p_admin_id: params.adminId,
    p_id: params.id,
    p_nome: params.nome,
    p_descricao: params.descricao,
    p_imagem_url: params.imagemUrl || null,
    p_total_unidades: params.totalUnidades ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function uploadItemImage(
  file: File
): Promise<{ url: string | null; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Invoca a Edge Function 'upload-item-image'
    const { data, error } = await supabase.functions.invoke("upload-item-image", {
      body: formData,
    });

    if (error) {
      console.error("Erro ao invocar a função de upload:", error);
      throw error;
    }

    if (data.error) {
      console.error("Erro retornado pela função de upload:", data.error);
      throw new Error(data.error);
    }
    
    console.log("Função invocada com sucesso, URL recebida:", data.url);
    return { url: data.url };
  } catch (e: any) {
    console.error("Erro catastrófico em uploadItemImage:", e);
    return { url: null, error: e.message ?? "Erro desconhecido no upload." };
  }
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
