# Análise Empresarial com IA

Sistema SaaS para análise financeira e de departamentos de empresas. Os indicadores são calculados com DuckDB, e a Claude API interpreta os resultados e redige o relatório.

Arquitetura e princípios: veja [CLAUDE.md](CLAUDE.md).

## Pré-requisitos

- Node.js 22+
- Uma conta no [Supabase](https://supabase.com)
- Uma chave da [Claude API](https://console.anthropic.com)
- Conta na [Vercel](https://vercel.com) e no GitHub (para deploy)

> **Windows:** mantenha o projeto fora de pastas sincronizadas (OneDrive/Dropbox) e em um caminho sem acentos nem espaços, por exemplo `C:\dev\analise-empresarial`.

## 1. Supabase

1. Crie um projeto em https://supabase.com/dashboard.
2. Em **Project Settings → API Keys**, copie:
   - a URL do projeto;
   - a **publishable key** (`sb_publishable_...`);
   - a **secret key** (`sb_secret_...`). Ela fica só no servidor.
3. Em **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (em produção, a URL da Vercel);
   - **Redirect URLs**: adicione `http://localhost:3000/auth/confirmar` e `https://SEU-APP.vercel.app/auth/confirmar`.
4. (Opcional, em desenvolvimento) Em **Authentication → Sign In / Providers → Email**, desative *Confirm email* para entrar direto após o cadastro.
5. As migrations do banco chegam na etapa 3. As instruções para aplicá-las serão adicionadas aqui.

## 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha o `.env.local`. A descrição de cada variável está no próprio [.env.example](.env.example).

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000. Você será redirecionado para `/login`.

Testes e verificação:

```bash
npm test
npm run typecheck
npm run lint
```

## 4. Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Na Vercel, **Add New → Project** e importe o repositório. O framework (Next.js) é detectado sozinho.
3. Em **Settings → Environment Variables**, cadastre as mesmas variáveis do `.env.local`.
4. Faça o deploy e adicione a URL gerada nas Redirect URLs do Supabase (passo 1.3).
