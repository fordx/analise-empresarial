/**
 * Configuração pública do Supabase (URL + chave publicável), usada no browser, no proxy e no servidor.
 * Falha com mensagem clara quando as variáveis estão ausentes ou trocadas entre si,
 * em vez de um erro genérico do supabase-js.
 */
export function configPublicaSupabase() {
  // Acesso literal a process.env.NEXT_PUBLIC_*: é assim que o Next injeta esses valores no bundle.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ausente ou inválida: deve começar com https:// (ex.: https://xxxx.supabase.co).",
    );
  }
  if (!chave || chave.startsWith("http")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente ou inválida: deve ser a chave publicável (sb_publishable_...).",
    );
  }
  return { url, chave };
}
