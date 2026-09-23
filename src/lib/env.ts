import "server-only";
import { z } from "zod";

/**
 * Variáveis de ambiente do servidor. Nunca importar este módulo em componentes client.
 * Validação preguiçosa: só falha quando alguém realmente pede a variável,
 * para que o build não quebre em etapas que ainda não usam todas elas.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().min(1),
  ANTHROPIC_MODEL_MAPEAMENTO: z.string().min(1).optional(),
  APAGAR_DADOS_BRUTOS_APOS_ANALISE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

type Env = z.infer<typeof schema>;

export function env<K extends keyof Env>(chave: K): Env[K] {
  const campo = schema.shape[chave];
  const resultado = campo.safeParse(process.env[chave]);
  if (!resultado.success) {
    throw new Error(`Variável de ambiente inválida ou ausente: ${chave}`);
  }
  return resultado.data as Env[K];
}
