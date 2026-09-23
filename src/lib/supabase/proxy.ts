import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PUBLICAS = ["/login", "/auth"];

/** Renova a sessão do Supabase a cada requisição e redireciona quem não está logado. */
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([chave, valor]) =>
            response.headers.set(chave, valor),
          );
        },
      },
    },
  );

  // Não coloque código entre a criação do cliente e getClaims():
  // é essa chamada que valida o JWT e renova a sessão.
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const publica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  if (!logado && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
