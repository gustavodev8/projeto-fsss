import { supabase } from "@/lib/supabase";

export interface Professor {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criado_em: string;
}

export async function listProfessors(): Promise<Professor[]> {
  const { data, error } = await supabase.rpc("fn_listar_professores");
  if (error || !data) return [];
  return data as Professor[];
}

export async function createProfessor(
  adminId: string,
  nome: string,
  email: string,
  senha: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("fn_criar_usuario", {
    p_admin_id: adminId,
    p_nome: nome,
    p_email: email,
    p_senha: senha,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateProfessor(
  adminId: string,
  id: string,
  nome: string,
  email: string,
  senha?: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("fn_atualizar_usuario", {
    p_admin_id: adminId,
    p_id: id,
    p_nome: nome,
    p_email: email,
    p_senha: senha || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteProfessor(
  adminId: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("fn_deletar_usuario", {
    p_admin_id: adminId,
    p_usuario_id: id,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
