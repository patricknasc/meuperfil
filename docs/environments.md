# Ambientes: DS, HM e PD

| | DS (desenvolvimento) | HM (homologação) | PD (produção) |
|---|---|---|---|
| Branch | qualquer feature branch | `develop` | `main` |
| App | `npm run dev` (localhost:3000) | Vercel Preview (branch `develop`) | Vercel Production |
| Domínio | `localhost:3000` | `hm.meuperfil.me` | `meuperfil.me` |
| Banco | Postgres no Docker (porta 5433) | Supabase `meuperfil-hml` | Supabase `meuperfil-prd` |
| Redis / fila | Redis no Docker (porta 6379) | Upstash (HM) | Upstash (PD) |
| Worker | `npm run worker` | host de worker (HM) | host de worker (PD) |
| E-mail | link no terminal (sem Resend) | Resend | Resend |
| Stripe | test mode | test mode | live mode |
| Meta | app em modo Development | app em modo Development + testers | app aprovado (Live) |

Fluxo: feature branch → PR para `develop` (deploy em HM) → PR de `develop` para `main` (deploy em PD).

## DS: rodar localmente

Pré-requisitos: Node 20+, Docker Desktop.

```bash
cp .env.example .env          # preencha NEXTAUTH_SECRET, CRON_SECRET, ENCRYPTION_KEY (openssl rand -hex 32)
npm install
npm run services:up           # Postgres (5433) + Redis (6379)
npm run db:migrate            # aplica as migrations
npm run dev                   # http://localhost:3000
npm run worker                # em outro terminal: DMs e publicação de posts
```

Login: com `RESEND_API_KEY` vazio, o link mágico aparece no terminal do `npm run dev`.

Alterou o `schema.prisma`? Gere a migration com `npm run db:migrate:dev -- --name <descricao>` e commite a pasta criada em `prisma/migrations/`.

## HM e PD: migrations

Nunca use `prisma db push` em HM/PD. As migrations são aplicadas pelo script, que lê apenas o `DIRECT_URL` de um arquivo local (ignorado pelo git):

```bash
# .env.hml  ->  DIRECT_URL=postgresql://postgres.<ref-hml>:<senha>@aws-0-<regiao>.pooler.supabase.com:5432/postgres
# .env.prd  ->  DIRECT_URL=postgresql://postgres.<ref-prd>:<senha>@aws-0-<regiao>.pooler.supabase.com:5432/postgres
npm run db:migrate:hml
npm run db:migrate:prd        # pede confirmação digitando "prd"
```

Ordem no deploy: aplicar a migration no ambiente **antes** de fazer merge do código que depende dela.

## Variáveis na Vercel

Cadastre em Settings → Environment Variables:

- **Production**: valores de PD.
- **Preview**, restrito à branch `develop`: valores de HM.

| Variável | HM | PD |
|---|---|---|
| `NEXTAUTH_URL` | `https://hm.meuperfil.me` | `https://meuperfil.me` |
| `NEXTAUTH_SECRET`, `CRON_SECRET`, `ENCRYPTION_KEY` | gerados para HM | gerados para PD (diferentes de HM) |
| `DATABASE_URL` | Supabase HM, Transaction pooler 6543 + `?pgbouncer=true&connection_limit=1` | idem PD |
| `DIRECT_URL` | Supabase HM, Session pooler 5432 | idem PD |
| `REDIS_URL` | Upstash HM | Upstash PD |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend | Resend |
| `STRIPE_*` | chaves e preços de test mode | chaves e preços live |
| `META_GRAPH_API_VERSION`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `FACEBOOK_APP_SECRET`, `WEBHOOK_VERIFY_TOKEN` | app Meta | app Meta |

`ENCRYPTION_KEY` criptografa os tokens do Instagram no banco: se mudar, as contas conectadas precisam reconectar. Nunca reutilize a de PD em outro ambiente.

O cron da Vercel (`vercel.json`) só roda em Production. As funções ficam em `gru1` (São Paulo), junto do Supabase `sa-east-1`.

## Worker

A Vercel não roda processos contínuos. O worker (`npm run worker`) precisa de um host próprio por ambiente (Railway, Render ou Fly.io), com as mesmas variáveis do app daquele ambiente.
