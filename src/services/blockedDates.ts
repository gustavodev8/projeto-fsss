import { apiDelete, apiGet, apiPost } from "@/lib/api";

export interface BlockedDate {
  id: string;
  data: string;
  motivo: string;
  criado_em: string;
}

export async function fetchBlockedDates(): Promise<BlockedDate[]> {
  try {
    const data = await apiGet<{ blockedDates: BlockedDate[] }>("/blocked-dates");
    return data.blockedDates ?? [];
  } catch {
    return [];
  }
}

export async function addBlockedDate(params: {
  data: string;
  motivo: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiPost("/admin/blocked-dates", { data: params.data, motivo: params.motivo || "Bloqueado" });
    return { ok: true };
  } catch (e: any) {
    const msg = e.message ?? "Erro ao bloquear data.";
    if (msg.toLowerCase().includes("already blocked")) {
      return { ok: false, error: "Esta data já está bloqueada." };
    }
    return { ok: false, error: msg };
  }
}

export async function removeBlockedDate(id: string): Promise<void> {
  await apiDelete(`/admin/blocked-dates/${id}`);
}
