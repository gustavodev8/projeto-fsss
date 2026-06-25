import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

export interface Professor {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criado_em: string;
}

export async function listProfessors(): Promise<Professor[]> {
  try {
    const data = await apiGet<{ professors: Professor[] }>("/admin/professors");
    return (data.professors ?? []).map((p: any) => ({
      id: p.id,
      nome: p.name ?? p.nome ?? "",
      email: p.email,
      ativo: Boolean(p.active ?? p.ativo),
      criado_em: p.created_at ?? p.criado_em ?? "",
    }));
  } catch {
    return [];
  }
}

export async function createProfessor(
  adminId: string,
  nome: string,
  email: string,
  senha: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiPost("/admin/professors", { admin_id: adminId, name: nome, email, password: senha });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Erro ao criar professor." };
  }
}

export async function updateProfessor(
  adminId: string,
  id: string,
  nome: string,
  email: string,
  senha?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiPut(`/admin/professors/${id}`, {
      admin_id: adminId,
      name: nome,
      email,
      password: senha || null,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Erro ao atualizar professor." };
  }
}

export async function deleteProfessor(
  adminId: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiDelete(`/admin/professors/${id}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Erro ao excluir professor." };
  }
}
