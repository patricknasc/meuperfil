# 🚀 Guia Completo de Implantação e Publicação — MeuPerfil (`meuperfil.me`)

Este documento é o guia definitivo passo a passo para colocar o sistema **MeuPerfil** em produção com alta disponibilidade, segurança, domínio próprio `https://meuperfil.me`, autenticação por e-mail, integração com a Meta (Instagram Graph API & Webhooks), pagamentos Stripe e internacionalização multilíngue (Português, Inglês e Espanhol).

---

## 📌 Sumário
1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Passo 1: Banco de Dados PostgreSQL (Neon / Supabase)](#passo-1-banco-de-dados-postgresql)
4. [Passo 2: Configuração no Meta for Developers (Instagram Graph API & Webhooks)](#passo-2-configuração-no-meta-for-developers)
5. [Passo 3: E-mail Transacional & Autenticação (Resend + Auth.js)](#passo-3-e-mail-transacional--autenticação)
6. [Passo 4: Pagamentos & Assinaturas (Stripe)](#passo-4-pagamentos--assinaturas-stripe)
7. [Passo 5: Deploy na Vercel (Recomendado)](#passo-5-deploy-na-vercel)
8. [Passo 6: Configuração de Domínio e DNS (`meuperfil.me`)](#passo-6-configuração-de-domínio-e-dns)
9. [Passo 7: Checklist de Validação em Produção](#passo-7-checklist-de-validação-em-produção)
10. [Resumo das Variáveis de Ambiente](#resumo-das-variáveis-de-ambiente)

---

## 1. Visão Geral da Arquitetura

- **Domínio de Produção:** `https://meuperfil.me`
- **Repositório GitHub:** `https://github.com/patricknasc/meuperfil.git`
- **Framework Web:** Next.js 16 (App Router + Turbopack + `proxy.ts` de i18n)
- **Link na Bio Integrado:** Página pública SSR (`https://meuperfil.me/pt/{handle}`) com 8 temas visuais, preview mobile no dashboard e tracking seguro de links (`/p/c/[blockId]`)
- **Internacionalização:** Detecção automática de idioma do navegador e chaveamento manual (`/pt`, `/en`, `/es`)
- **Banco de Dados:** PostgreSQL gerenciado via Prisma ORM (`Profile`, `ProfileBlock`, `ProfileVisit`, `ProfileBlockClick`, `Workspace`, `Campaign`, `Automation`)
- **Autenticação:** Auth.js v5 (NextAuth) com Magic Link (sem senhas) via Resend
- **Integração Social:** Instagram Graph API (Instagram Business/Creator via Meta App)
- **Webhooks:** Ingestão de eventos de comentários e envio imediato de Direct Messages em conformidade com as diretrizes da Meta

---

## 2. Pré-requisitos

Antes de iniciar, certifique-se de possuir:
1. Conta no **GitHub** com acesso ao repositório `patricknasc/meuperfil`.
2. Conta na **Vercel** (ou outro provedor como Coolify/VPS).
3. Conta em um provedor de **PostgreSQL Serverless** (ex: [Neon.tech](https://neon.tech) ou [Supabase](https://supabase.com)).
4. Conta no **[Meta for Developers](https://developers.facebook.com)** com uma conta comercial do Instagram vinculada a uma Página do Facebook.
5. Conta no **[Resend](https://resend.com)** para envio de magic links.
6. Conta no **[Stripe](https://stripe.com)** (opcional para cobrança de assinaturas).
7. Acesso ao painel de DNS do domínio `meuperfil.me` (Cloudflare, GoDaddy, Registro.br, Namecheap, etc.).

---

## Passo 1: Banco de Dados PostgreSQL no Supabase

Utilizaremos o **Supabase** pela robustez, escalabilidade e pelo connection pooler integrado (PgBouncer/Supavisor), essencial para Next.js na Vercel.

### 1.1 Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Clique em **New Project** e defina:
   - **Name**: `meuperfil-prod`
   - **Database Password**: Defina uma senha forte (guarde-a, você precisará dela na connection string).
   - **Region**: Selecione a região mais próxima dos seus usuários (ex: `São Paulo (sa-east-1)` ou `East US (us-east-1)` caso sua Vercel esteja em Washington/us-east).
3. Aguarde o provisionamento do banco (cerca de 1 a 2 minutos).

### 1.2 Obter as Connection Strings do Supabase
Vá em **Project Settings (ícone de engrenagem) > Database > Connection String**:

1. **Transaction Pooler (Porta 6543)** — Usado no `DATABASE_URL` (para a aplicação Next.js na Vercel e o Worker):
   - Selecione a aba **URI** e marque o modo **Transaction**.
   - Formato:
     ```text
     postgresql://postgres.[PROJECT-REF]:[SUA-SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
     ```
2. **Session / Direct Connection (Porta 5432)** — Usado no `DIRECT_URL` (para rodar migrações do Prisma):
   - Selecione a aba **URI** e marque o modo **Session** (ou porta 5432).
   - Formato:
     ```text
     postgresql://postgres.[PROJECT-REF]:[SUA-SENHA]@aws-0-[REGIAO].pooler.supabase.com:5432/postgres
     ```

### 1.3 Aplicar o Schema do Banco
No seu computador local, aponte o `DATABASE_URL` para o Supabase no arquivo `.env` e rode:
```bash
npx prisma generate
npx prisma db push
```
*(Todas as tabelas de Workspaces, Perfis, Agendamentos, Automações e Logs serão criadas automaticamente no Supabase).*

---

## Passo 2: Configuração no Meta for Developers

Para que o MeuPerfil possa ler comentários em posts/reels e responder automaticamente via DM pelo Instagram, é necessário criar e configurar um App na Meta.

### 2.1 Criar o Aplicativo
1. Acesse o [Meta for Developers](https://developers.facebook.com/apps).
2. Clique em **Criar Aplicativo** (*Create App*).
3. Selecione o tipo de aplicativo: **Outro** > **Empresa** (*Business*).
4. Defina o nome do aplicativo: `MeuPerfil`.
5. Insira o e-mail de contato de suporte.

### 2.2 Adicionar Produtos ao App
No painel do aplicativo, adicione:
- **Instagram Graph API**
- **Login do Facebook para Empresas** (*Facebook Login for Business*)
- **Webhooks**

### 2.3 Obter Chaves do Aplicativo
1. Vá em **Configurações do Aplicativo > Básico** (*App Settings > Basic*).
2. Copie:
   - **ID do Aplicativo** (`META_APP_ID` ou `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_APP_ID`)
   - **Chave Secreta do Aplicativo** (`META_APP_SECRET` ou `INSTAGRAM_CLIENT_SECRET` / `INSTAGRAM_APP_SECRET`)
3. Em **Domínios do Aplicativo**, insira: `meuperfil.me`.
4. Em **URL da Política de Privacidade**, insira: `https://meuperfil.me/pt/privacy`.
5. Em **URL dos Termos de Serviço**, insira: `https://meuperfil.me/pt/terms`.
6. Em **Exclusão de Dados do Usuário**, insira: `https://meuperfil.me/pt/data-deletion`.

### 2.4 Configurar URI de Redirecionamento OAuth
1. Em **Login do Facebook > Configurações**:
2. No campo **URIs de redirecionamento do OAuth válidos**, adicione:
   ```text
   https://meuperfil.me/api/instagram/callback
   ```
3. Salve as alterações.

### 2.5 Configurar Webhooks do Instagram
1. Em **Webhooks**, selecione o objeto **Instagram** no menu suspenso.
2. Clique em **Inscrever-se neste tópico** (*Subscribe to this object*).
3. Defina:
   - **URL de Retorno de Chamada (*Callback URL*)**: `https://meuperfil.me/api/webhook`
   - **Token de Verificação (*Verify Token*)**: Crie uma chave secreta e coloque no `WEBHOOK_VERIFY_TOKEN` (exemplo: uma string forte aleatória gerada com openssl).
4. **Campos do Webhook para Assinar:**
   - **`comments` (OBRIGATÓRIO)**: Notifica em tempo real comentários em posts/reels para disparar DMs automáticas com base em palavras-chave.
   - **`mentions` (Opcional/Recomendado)**: Notifica quando marcam seu perfil em legendas ou Stories de terceiros.
   - **`messages` (Opcional/Recomendado)**: Notifica mensagens enviadas no chat direto da DM.

### 2.6 Como Usar Sua Própria Conta como Testador (Modo Desenvolvimento)
Enquanto o aplicativo da Meta estiver em **Modo Desenvolvimento** (antes de submeter para análise pública da Meta), você já pode testar tudo sem restrições com a sua própria conta:
1. No Meta for Developers, vá em **Funções do Aplicativo > Funções** (*App Roles > Roles*).
2. Na seção **Testadores do Instagram** (*Instagram Testers*), clique em **Adicionar Testadores do Instagram**.
3. Digite o seu `@username` do Instagram e envie o convite.
4. **Aceitar o convite:**
   - No navegador, acesse: [instagram.com/accounts/manage_access](https://www.instagram.com/accounts/manage_access)
   - Clique na aba **Convites de Testador** (*Tester Invites*) e clique em **Aceitar**.
   - Pronto! Sua conta agora pode ser conectada ao MeuPerfil e testada livremente.

### 2.7 Permissões Solicitadas pelo App:
- `instagram_basic`
- `instagram_manage_comments`
- `instagram_manage_messages`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`

---

## Passo 3: E-mail Transacional & Autenticação

O sistema utiliza autenticação sem senha (Magic Link).

1. Crie uma conta no [Resend](https://resend.com).
2. Vá em **Domains > Add Domain** e adicione `meuperfil.me`.
3. Configure os registros DNS fornecidos pelo Resend no seu painel DNS (`TXT`, `MX`, `CNAME` para DKIM e SPF).
4. Vá em **API Keys > Create API Key** com permissão de envio.
5. Copie a chave: `re_123456789...`.
6. Gere as chaves criptográficas seguras executando no seu terminal:
   ```bash
   # Para AUTH_SECRET e NEXTAUTH_SECRET:
   openssl rand -base64 32

   # Para ENCRYPTION_KEY (obrigatoriamente 64 caracteres hexadecimais):
   openssl rand -hex 32
   ```

---

## Passo 4: Pagamentos & Assinaturas (Stripe)

*(Opcional — caso utilize planos pagos como Pro e Agency)*

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com).
2. Crie os produtos e preços para:
   - **Plano Pro**: Mensal.
   - **Plano Agency**: Mensal.
3. Copie os Price IDs (`price_...`) para as variáveis `STRIPE_PRICE_PRO` e `STRIPE_PRICE_AGENCY`.
4. Em **Desenvolvedores > Chaves de API**:
   - `STRIPE_SECRET_KEY`: `sk_live_...` (ou `sk_test_...` para testes)
5. Em **Desenvolvedores > Webhooks**:
   - Adicione o endpoint: `https://meuperfil.me/api/stripe/webhook`
   - Eventos para ouvir: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copie o **Segredo de Assinatura do Webhook** (`STRIPE_WEBHOOK_SECRET`): `whsec_...`.

---

## Passo 5: Deploy da Aplicação & Worker

O MeuPerfil é composto por dois serviços coordenados:
1. **Web / API (Next.js na Vercel)**
2. **Worker de Filas (Processamento contínuo no Railway)**

### 5.1 Deploy na Vercel (Web / API)
1. Acesse o [Vercel Dashboard](https://vercel.com) e clique em **Add New... > Project**.
2. Importe o repositório `patricknasc/meuperfil`.
3. Em **Framework Preset**, o Next.js será detectado automaticamente.
4. Em **Environment Variables**, cadastre todas as variáveis de ambiente (veja a tabela completa na seção 10).
5. Clique em **Deploy**.

### 5.2 Deploy no Railway (Worker de Filas Contínuo)
O Worker é responsável por entregar as DMs respeitando o rate limit da Meta e publicar os posts agendados na data/hora exata:
1. Acesse [railway.app](https://railway.app) e crie um novo projeto importando o mesmo repositório do GitHub.
2. Nas configurações do serviço (**Settings > Deploy**), defina o **Start Command**:
   ```bash
   npm run worker
   ```
3. Em **Variables**, adicione as mesmas variáveis de banco (`DATABASE_URL`), `REDIS_URL`, chaves da Meta e `ENCRYPTION_KEY`.
4. Faça o deploy do Worker. Ele rodará em segundo plano consumindo as filas `dm-processing` e `post-publishing`.

---

## Passo 6: Configuração de Domínio e DNS

1. No projeto da Vercel, vá em **Settings > Domains**.
2. Adicione:
   - `meuperfil.me`
   - `www.meuperfil.me`
3. Configure os registros no seu gerenciador de DNS (ex: Cloudflare, Registro.br, etc.):

| Tipo | Nome / Host | Valor / Destino | Proxy / TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (ou `meuperfil.me`) | `76.76.21.21` | DNS Only (se usar Cloudflare) |
| **CNAME** | `www` | `cname.vercel-dns.com` | DNS Only (se usar Cloudflare) |

4. A Vercel emitirá o certificado SSL/TLS (HTTPS) automaticamente em poucos minutos.

---

## Passo 7: Checklist de Validação em Produção

Após o deploy e propagação do DNS:

1. **Acesso Inicial:**
   - Acesse `https://meuperfil.me` — o sistema deverá detectar o idioma do seu navegador e direcionar para `/pt`, `/en` ou `/es`.
   - Teste a troca de idioma no topo/rodapé da página usando o seletor `LanguageSwitcher`.
2. **Autenticação:**
   - Acesse `https://meuperfil.me/pt/login`.
   - Digite seu e-mail e solicite o link mágico.
   - Verifique se o e-mail chega em sua caixa de entrada e clique para autenticar.
3. **Criação e Gestão de Link na Bio:**
   - Acesse **Link na Bio** (`https://meuperfil.me/pt/profiles`) e crie um novo perfil (ex: `@meunome`).
   - No **Studio do Perfil** (`/pt/profiles/[id]`), adicione blocos de links, redes sociais e alterne entre os 8 temas.
   - Verifique se o **Preview Mobile** reflete as alterações em tempo real.
   - Publique o perfil e acesse a página pública `https://meuperfil.me/pt/meunome`.
   - Clique em um dos links para validar o redirecionamento com tracking (`/p/c/[blockId]`) e verifique o incremento no contador de cliques/visitas.
4. **Conexão com o Instagram:**
   - No Dashboard, vá em **Configurações > Conectar Conta do Instagram**.
   - Conclua a autorização no Facebook/Instagram.
   - Verifique se a conta conectada aparece listada com `@username`.
5. **Criação de Campanha de Comentário → Direct:**
   - Acesse **Campanhas > Nova Campanha**.
   - Escolha um post recente, defina uma palavra-chave (ex: `QUERO`) e a mensagem de DM com um link de destino (podendo ser o próprio link da sua bio!).
6. **Teste de Disparo Real:**
   - Com outra conta do Instagram, comente a palavra-chave configurada no post.
   - Verifique o recebimento da DM em poucos segundos.
   - Verifique o registro em **Logs de DMs** no Dashboard.
7. **Relatórios e Links Rastreáveis:**
   - Clique no link gerado na DM (`https://meuperfil.me/r/[slug]`) e confirme o redirecionamento.
   - Abra a página pública de relatório do cliente (`https://meuperfil.me/pt/reports/[shareSlug]`) e confirme a contagem de cliques e envios.
8. **Agendamento de Posts & Reels (Content Scheduler):**
   - Acesse **Agendador** (`https://meuperfil.me/pt/scheduler`).
   - Clique em **+ Agendar Publicação** e escolha um formato (ex: Reels ou Carrossel).
   - Insira a URL da mídia, preencha a legenda e ative a **Automação Integrada (Comentário → Direct)** com palavras-chave (ex: `QUERO`, `LINK`).
   - Verifique o agendamento na **Visão de Calendário** ou teste o disparo imediato clicando em **Publicar Agora**.
   - Assim que o post for publicado pela Meta Graph API, confirme que a automação correspondente foi gerada automaticamente na aba **Campanhas**.

---

## Resumo das Variáveis de Ambiente

Crie ou preencha as variáveis abaixo no painel da **Vercel** (ou no seu arquivo `.env.production`):

```env
# ==============================================================================
# APLICAÇÃO & URLs
# ==============================================================================
NEXTAUTH_URL="https://meuperfil.me"
NEXTAUTH_SECRET="sua_chave_auth_secret_gerada_com_openssl"
AUTH_SECRET="sua_chave_auth_secret_gerada_com_openssl"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="https://meuperfil.me"

# ==============================================================================
# BANCO DE DADOS (POSTGRESQL - SUPABASE)
# ==============================================================================
# Modo Transaction Pooler (Porta 6543) para Vercel Serverless
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# Modo Session / Direct (Porta 5432) para Prisma Migrations
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# ==============================================================================
# FILA & REDIS (UPSTASH / RAILWAY)
# ==============================================================================
REDIS_URL="redis://default:senha@host:port"

# ==============================================================================
# META & INSTAGRAM GRAPH API
# ==============================================================================
META_GRAPH_API_VERSION="v22.0"
INSTAGRAM_APP_ID="seu_meta_app_id"
INSTAGRAM_APP_SECRET="seu_meta_app_secret"
FACEBOOK_APP_SECRET="seu_meta_app_secret"
WEBHOOK_VERIFY_TOKEN="seu_token_de_verificacao_webhook"
ENCRYPTION_KEY="sua_chave_hex_64_caracteres_gerada_com_openssl_rand_hex_32"

# ==============================================================================
# E-MAIL TRANSACIONAL (RESEND)
# ==============================================================================
RESEND_API_KEY="re_123456789abcdef"
EMAIL_FROM="MeuPerfil <login@meuperfil.me>"

# ==============================================================================
# BILLING / STRIPE (OPCIONAL)
# ==============================================================================
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_AGENCY="price_..."
```

---

## 🎉 Pronto!

Seu sistema **MeuPerfil** está pronto para operar em escala em `https://meuperfil.me` com total conformidade com a Meta, rastreamento de cliques e internacionalização completa!
