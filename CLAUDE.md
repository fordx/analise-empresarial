@AGENTS.md

# Análise Empresarial com IA

SaaS de análise financeira e de departamentos de empresas (financeiro no MVP; comercial, RH e operações depois).
Fluxo: o usuário escolhe empresa + departamento + período → o sistema obtém os dados (upload ou API de ERP) →
calcula indicadores no DuckDB → o Claude interpreta e redige o relatório (resumo, achados, riscos, recomendações).
Interface, relatórios, nomes de domínio e mensagens em **português do Brasil**.

## Stack
Next.js 16 (App Router, `src/`, `proxy.ts` em vez de middleware) · TypeScript · Tailwind 4 + shadcn/ui (estilo base-nova, Base UI) ·
Supabase (Auth, Postgres + RLS, Storage, Vault) · DuckDB (`@duckdb/node-api`) · Claude API (`@anthropic-ai/sdk`) · Zod 4 · Vitest · deploy na Vercel.

## Princípios (não negociáveis)
1. **A IA não faz contas.** Todo número é calculado em código/SQL (DuckDB). O Claude recebe indicadores prontos via tool use.
   Todo número do relatório é rastreável: `{ valor, formula, fontes: [{ arquivo, periodo, sql }] }`.
2. **Formato canônico.** Toda fonte vira `lancamentos`, `plano_de_contas`, `centros_de_custo`, `titulos`, `vendas`.
   O motor de análise não sabe de onde o dado veio.
3. **Conectores como adaptadores** (`src/domain/conectores/types.ts`). Conector grava Parquet no Storage; DuckDB lê.
4. **Dados brutos são temporários.** Brutos e Parquets podem ser apagados após a análise (`APAGAR_DADOS_BRUTOS_APOS_ANALISE`).
   No Postgres: só metadados, de-para, histórico de análises e relatórios.
5. **Multi-tenant.** Toda tabela tem `empresa_id`; o RLS limita o acesso às empresas vinculadas ao usuário.
6. **Segredos só no servidor.** `ANTHROPIC_API_KEY`, `SUPABASE_SECRET_KEY` e credenciais de ERP nunca vão ao client.
   Módulos com segredos importam `server-only`; ler env via `env()` de `src/lib/env.ts`.

## Organização
- `src/app` — rotas. `(auth)/login`, `(app)/...` (área logada, protegida pelo layout + `src/proxy.ts`).
- `src/lib/supabase` — `client.ts` (browser), `server.ts` (usuário da requisição, com RLS), `admin.ts` (chave secreta, ignora RLS — só em jobs, sempre filtrando `empresa_id`), `proxy.ts` (renovação de sessão).
- `src/lib/duckdb` — conexão e helpers (etapa 2).
- `src/domain` — regras de negócio: `canonico/`, `conectores/`, `indicadores/<departamento>/`, `mapeamento/`, `analise/`, `departamentos/`, `pdf/`.
- `supabase/migrations` — schema + RLS em SQL.
- `dados-exemplo/` — empresa fictícia para testes de ponta a ponta.

## Convenções
- Cada indicador é uma função pura/testável com a fórmula documentada em JSDoc e um `*.test.ts` ao lado.
- Saída do Claude sempre validada com Zod antes de salvar.
- Registrar tokens de entrada/saída por análise (`analises.custo_tokens`).
- Rotas que usam DuckDB: `export const runtime = "nodejs"`.

## Comandos
- `npm run dev` — servidor local (http://localhost:3000)
- `npm run build` — build de produção
- `npm run typecheck` — gera tipos de rota e roda `tsc`
- `npm run lint`
- `npm test` / `npm run test:watch` — Vitest

## Estado do projeto
Etapas: 1 setup+Auth ✅ · 2 DuckDB na Vercel · 3 migrations+RLS · 4 upload/parse Excel/CSV · 5 indicadores ·
6 de-para por IA · 7 análise com Claude · 8 relatório+PDF · 9 SPED ECD.
