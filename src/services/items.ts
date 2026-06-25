import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { ReservableItem, TimeSlot } from "@/types";

type ApiItem = {
  id: string;
  name: string;
  description?: string;
  category: "espacos" | "instrumentos";
  image?: string;
  available: boolean;
  totalUnits?: number | null;
  availableUnits?: number | null;
};

function mapItem(r: ApiItem): ReservableItem {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    category: r.category,
    image: r.image ?? "",
    available: r.available,
    totalUnits: r.totalUnits ?? undefined,
    availableUnits: r.availableUnits ?? undefined,
  };
}

export async function fetchItems(
  categoria: "espacos" | "instrumentos"
): Promise<ReservableItem[]> {
  try {
    const data = await apiGet<{ items: ApiItem[] }>(`/items?category=${encodeURIComponent(categoria)}`);
    return (data.items ?? []).map(mapItem);
  } catch {
    return [];
  }
}

export async function fetchItemById(id: string): Promise<ReservableItem | null> {
  try {
    const data = await apiGet<{ item: ApiItem }>(`/items/${id}`);
    return data.item ? mapItem(data.item) : null;
  } catch {
    return null;
  }
}

export async function fetchAllItems(): Promise<ReservableItem[]> {
  try {
    const data = await apiGet<{ items: ApiItem[] }>("/items");
    return (data.items ?? []).map(mapItem);
  } catch {
    return [];
  }
}

export async function createItem(params: {
  adminId: string;
  nome: string;
  descricao: string;
  categoria: "espacos" | "instrumentos";
  imagemUrl?: string;
  totalUnidades?: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiPost("/admin/items", {
      admin_id: params.adminId,
      name: params.nome,
      description: params.descricao,
      category: params.categoria,
      image_url: params.imagemUrl || null,
      total_units: params.totalUnidades ?? null,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Erro ao criar item." };
  }
}

export async function deleteItem(
  adminId: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiDelete(`/admin/items/${id}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Erro ao remover item." };
  }
}

export async function forceDeleteItem(
  adminId: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiPost(`/admin/items/${id}/force-delete`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Erro ao forçar exclusão." };
  }
}

export async function updateItem(params: {
  adminId: string;
  id: string;
  nome: string;
  descricao: string;
  imagemUrl?: string;
  totalUnidades?: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiPut(`/admin/items/${params.id}`, {
      admin_id: params.adminId,
      name: params.nome,
      description: params.descricao,
      image_url: params.imagemUrl || null,
      total_units: params.totalUnidades ?? null,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Erro ao atualizar item." };
  }
}

export async function uploadItemImage(
  file: File
): Promise<{ url: string | null; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const data = await apiPost<{ filename: string; url: string }>("/upload-item-image", formData);
    return { url: data.url };
  } catch (e: any) {
    return { url: null, error: e.message ?? "Erro desconhecido no upload." };
  }
}

export async function fetchHorarios(): Promise<TimeSlot[]> {
  try {
    const data = await apiGet<{ timeSlots: Array<{ label: string; start: string; end: string; isBreak: boolean }> }>("/time-slots");
    return (data.timeSlots ?? []).map((r) => ({
      label: r.label,
      start: r.start,
      end: r.end,
      isBreak: r.isBreak,
    }));
  } catch {
    return [];
  }
}
