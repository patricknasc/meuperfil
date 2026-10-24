# Ambientes: DS, HM e PD

| | DS (desenvolvimento) | HM (homologação) | PD (produção) |
|---|---|---|---|
| Branch | qualquer feature branch | `develop` | `main` |
| App | `./iniciar-local.sh` (localhost:3000+) | Vercel Preview (branch `develop`) | Vercel Production |
| Domínio | `localhost:3000` | `hm.meuperfil.me` | `meuperfil.me` |
| Banco | Postgres no Docker (porta 5433) | Supabase `meuperfil-hm` | Supabase `meuperfil-pd` |
| Redis / fila | Redis no Docker (porta 6379) | Upstash (HM) | Upstash (PD) |
| Worker | `npm run worker` | host de worker (HM) | host de worker (PD) |
| E-mail | link no terminal (sem Resend) | Resend | Resend |
| Stripe | test mode | test mode | live mode |
| Meta | app em modo Development | app em modo Development + testers | app aprovado (Live) |

Fluxo: feature branch → PR para `develop` (deploy em HM) → PR de `develop` para `main` (deploy em PD).

Cada ambiente tem sua branch: `main` = PD, `develop` = HM, demais branches = DS (só local). O `ignoreCommand` em `vercel.json` faz a Vercel ignorar pushes em qualquer outra branch.

## DS: rodar localmente

Pré-requisitos: Node 24 (ver `.nvmrc`), Docker Desktop.

Atalho: `./iniciar-local.sh` faz todos os passos abaixo (e `./iniciar-local.sh parar` desliga o Docker). Manualmente:

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
# .env.hm  ->  DIRECT_URL=postgresql://postgres.<ref-hm>:<senha>@aws-0-<regiao>.pooler.supabase.com:5432/postgres
# .env.pd  ->  DIRECT_URL=postgresql://postgres.<ref-pd>:<senha>@aws-0-<regiao>.pooler.supabase.com:5432/postgres
npm run db:migrate:hm
npm run db:migrate:pd        # pede confirmação digitando "pd"
```

Ordem no deploy: aplicar a migration no ambiente **antes** de fazer merge do código que depende dela.

## Senhas e segredos

- Cofre oficial: gerenciador de senhas (app Senhas do macOS, 1Password ou Bitwarden), uma entrada por ambiente: `MeuPerfil HM` e `MeuPerfil PD`, com senha do banco, connection strings e chaves geradas.
- Cópias de uso: Vercel (variáveis do ambiente) e `.env.hm` / `.env.pd` locais, ignorados pelo git.
- Nunca em commits, issues, prints ou chats. Senha do banco: só letras e números (evita percent-encoding na URL). Se vazar, troque em Supabase → Database → Settings → Reset password e atualize Vercel e `.env.*`.

## Variáveis na Vercel

Use o script (evita erros de ambiente/branch na interface):

```bash
npx vercel login && npx vercel link   # uma vez
./scripts/vercel-env.sh pd            # .env.pd -> Production (Secret)
./scripts/vercel-env.sh hm            # .env.hm -> Preview, branch develop (Secret)
```

Depois de mudar um valor, rode o script de novo e faça Redeploy. Equivalente na interface (Settings → Environment Variables):

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

## Acesso ao HM: duas portas

O HM é protegido pela Vercel (Deployment Protection). Todo acesso passa por duas verificações, nesta ordem:

```
Pessoa digita hm.meuperfil.me
        │
        ▼
 PORTA 1 — Vercel (antes do nosso app)
   Tem o cookie de acesso da Vercel para este domínio?
   ├─ não → redireciona para o login da Vercel
   │         → logou e é dono/membro do time? → recebe o cookie e volta
   │         → não é do time? → acesso negado (o app nunca é acionado)
   └─ sim → deixa passar
        │
        ▼
 PORTA 2 — MeuPerfil (nosso app)
   Tem sessão do MeuPerfil (login por link mágico)?
   ├─ não → páginas públicas abrem; o dashboard redireciona para /pt/login
   └─ sim → mostra o workspace da pessoa
```

**O endereço é público, o conteúdo não.** Qualquer pessoa pode digitar `hm.meuperfil.me` e o DNS responde, mas quem não passa pela porta 1 só vê a tela de login da Vercel. Nenhuma página, dado ou código do HM é entregue. O que fica visível é apenas o nome do domínio.

**Quem tem acesso** é decidido na porta 1: só membros do time `meuperfil1` na Vercel. No plano Hobby o time tem um único membro (o dono) e não é possível adicionar outros. Para liberar testadores ou sócios é preciso o plano Pro, com gestão em *Team Settings → Members*. A configuração da proteção fica em *Project → Settings → Deployment Protection → Vercel Authentication* (hoje *Standard Protection*: protege tudo, exceto o domínio de produção).

**Quando cada porta reconhece a pessoa:**

1. Vercel: no login da Vercel, que grava um cookie para `hm.meuperfil.me`. A cada requisição a Vercel confere esse cookie antes de chamar o app.
2. MeuPerfil: ao clicar no link mágico do e-mail, o app cria a sessão (outro cookie). A cada página do dashboard o app confere a sessão e o workspace a que a pessoa pertence.

A porta 1 existe só no HM. Em PD (`meuperfil.me`) o site é público e só existe a porta 2.

**Consequências práticas:**

- Abra o link mágico de login do HM em um navegador já logado na Vercel. Em janela anônima, o desvio pelo login da Vercel faz o link chegar ao app sem o `token`, e o login falha com `error=Configuration`.
- Webhooks externos (Meta, Stripe) não passam pela porta 1. No HM eles precisam do *Protection Bypass for Automation* da Vercel.

## Worker

A Vercel não roda processos contínuos. O worker (`npm run worker`) precisa de um host próprio por ambiente (Railway, Render ou Fly.io), com as mesmas variáveis do app daquele ambiente.
