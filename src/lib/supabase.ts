import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  console.error(
    "[Supabase] Variáveis de ambiente não encontradas.\n" +
    "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel (Settings → Environment Variables) e faça Redeploy."
  );
}

export const supabase = createClient(url ?? "", key ?? "");
