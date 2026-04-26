import { supabase } from "@/lib/supabase";

// Required Supabase SQL (run once in the SQL editor):
// CREATE TABLE dias_bloqueados (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   data date NOT NULL UNIQUE,
//   motivo text NOT NULL DEFAULT '',
//   criado_em timestamptz NOT NULL DEFAULT now()
// );
// ALTER TABLE dias_bloqueados ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "allow_all" ON dias_bloqueados FOR ALL USING (true) WITH CHECK (true);

export interface BlockedDate {
  id: string;
  data: string;   // "YYYY-MM-DD"
  motivo: string;
  criado_em: string;
}

export async function fetchBlockedDates(): Promise<BlockedDate[]> {
  const { data, error } = await supabase
    .from("dias_bloqueados")
    .select("id, data, motivo, criado_em")
    .order("data", { ascending: true });
  if (error || !data) return [];
  return data as BlockedDate[];
}

export async function addBlockedDate(params: {
  data: string;
  motivo: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("dias_bloqueados")
    .insert({ data: params.data, motivo: params.motivo || "Bloqueado" });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esta data já está bloqueada." };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function removeBlockedDate(id: string): Promise<void> {
  await supabase.from("dias_bloqueados").delete().eq("id", id);
}
