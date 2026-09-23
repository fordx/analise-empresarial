import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: [
    // Tudo, exceto arquivos estáticos, imagens e as rotas de API
    // (as APIs verificam a sessão por conta própria e respondem 401).
    "/((?!api|_next/static|_next/image|favicon.ico|modelos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xlsx|csv)$).*)",
  ],
};
