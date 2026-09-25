import "server-only";
import { z } from "zod";

/**
 * Variáveis de ambiente do servidor. Nunca importar este módulo em componentes client.
 * Validação preguiçosa: só falha quando alguém realmente pede a variável,
 * para que o build não quebre em etapas que ainda não usam todas elas.
 */
// As variáveis NEXT_PUBLIC_SUPABASE_* ficam em src/lib/supabase/publico.ts (valem também no browser).
const schema = z.object({
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_", "deve ser a chave secreta (sb_secret_...)"),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().min(1),
  ANTHROPIC_MODEL_MAPEAMENTO: z.string().min(1).optional(),
  APAGAR_DADOS_BRUTOS_APOS_ANALISE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  HEALTH_CHECK_TOKEN: z.string().min(16).optional(),
});

type Env = z.infer<typeof schema>;

export function env<K extends keyof Env>(chave: K): Env[K] {
  const campo = schema.shape[chave];
  // Espaços/quebras de linha coladas por engano são removidos; vazio conta como ausente.
  const resultado = campo.safeParse(process.env[chave]?.trim() || undefined);
  if (!resultado.success) {
    // Só o nome e o motivo: nunca incluir o valor na mensagem.
    throw new Error(
      `Variável de ambiente inválida ou ausente: ${chave} (${resultado.error.issues[0].message})`,
    );
  }
  return resultado.data as Env[K];
}
