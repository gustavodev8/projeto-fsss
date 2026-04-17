import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export async function signIn(email: string, password: string): Promise<DbUser | null> {
  const { data, error } = await supabase.rpc("fn_login", {
    p_email: email,
    p_senha: password,
  });

  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return { id: row.id, name: row.nome, email: row.email, role: row.perfil };
}
