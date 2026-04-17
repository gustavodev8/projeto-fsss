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
  nome: string,
  email: string,
  senha: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("fn_criar_usuario", {
    p_nome: nome,
    p_email: email,
    p_senha: senha,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
