import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configPublicaSupabase } from "./publico";

/**
 * Cliente para Server Components, Server Actions e Route Handlers,
 * autenticado como o usuário da requisição (RLS se aplica).
 * Crie um novo cliente por requisição.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, chave } = configPublicaSupabase();

  return createServerClient(url, chave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de um Server Component: os cookies são
          // renovados pelo proxy, então podemos ignorar.
        }
      },
    },
  });
}
