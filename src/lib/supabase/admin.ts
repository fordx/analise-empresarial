import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cliente com a chave secreta: IGNORA o RLS.
 * Usar apenas em jobs de servidor (processamento de análises, conectores)
 * e sempre filtrando explicitamente por empresa_id.
 */
export function createAdminClient() {
  return createSupabaseClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
