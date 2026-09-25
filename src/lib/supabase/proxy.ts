import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configPublicaSupabase } from "./publico";

const ROTAS_PUBLICAS = ["/login", "/auth"];

/** Renova a sessão do Supabase a cada requisição e redireciona quem não está logado. */
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  let config: ReturnType<typeof configPublicaSupabase>;
  try {
    config = configPublicaSupabase();
  } catch (e) {
    // Erro de configuração do deploy: a mensagem só cita nomes de variáveis, nunca valores.
    const mensagem = e instanceof Error ? e.message : String(e);
    console.error(`[proxy] ${mensagem}`);
    return new NextResponse(`Erro de configuração do servidor: ${mensagem}`, { status: 500 });
  }

  const supabase = createServerClient(
    config.url,
    config.chave,
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
