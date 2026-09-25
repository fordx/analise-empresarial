import { createBrowserClient } from "@supabase/ssr";
import { configPublicaSupabase } from "./publico";

/** Cliente para componentes client. Usa apenas a chave publicável; o RLS protege os dados. */
export function createClient() {
  const { url, chave } = configPublicaSupabase();
  return createBrowserClient(url, chave);
}
