# MeuPerfil Production Deployment

This app is designed as two deployable services:

- **Web/API**: Next.js on Vercel.
- **Worker**: a persistent Railway service running `npm run worker`.

PostgreSQL (Supabase) and Redis (Upstash / Railway) should be provisioned and shared by both services.
- On Supabase, use the **Transaction Pooler URL (Port 6543)** with `?pgbouncer=true&connection_limit=1` for `DATABASE_URL` in serverless/Vercel.
- For running migrations (`npm run db:migrate` / `npx prisma db push`), use the **Direct Connection URL (Port 5432)** or set `DIRECT_URL`.

## Required Environment Variables

Copy `.env.example` and set every value in Vercel and Railway:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`
- `ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`
- `META_GRAPH_API_VERSION`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `FACEBOOK_APP_SECRET`
- `WEBHOOK_VERIFY_TOKEN`

`ENCRYPTION_KEY` must be 64 hex characters. Generate one with:

```bash
openssl rand -hex 32
```

## Database

Run migrations before starting production traffic:

```bash
npm ci
npm run db:generate
npm run db:migrate
```

## Vercel Web/API

1. Create a Vercel project from this repository.
2. Add all environment variables.
3. Set the production domain as `NEXTAUTH_URL`.
4. Deploy.
5. Vercel Cron will call `/api/cron/refresh-tokens` daily using `vercel.json`.

## Railway Worker

Create a second Railway service from the same repository.

Start command:

```bash
npm run worker
```

The unified worker handles:
- **`dm-processing`**: Rate-limited private direct message delivery on comment triggers.
- **`post-publishing`**: Scheduled Reels, Stories, Carousels and Feed posts publishing to Meta Graph API, with automatic Comment-to-DM campaign attachment.

Use the same `DATABASE_URL`, `REDIS_URL`, Meta, Stripe, and encryption environment variables as the Vercel app.

## Stripe

1. Create monthly subscription prices for Pro and Agency.
2. Put the price IDs into `STRIPE_PRICE_PRO` and `STRIPE_PRICE_AGENCY`.
3. Add a webhook endpoint pointing to:

```text
https://your-domain.com/api/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Meta App & Permissions

Configure the webhook callback URL:

```text
https://your-domain.com/api/webhook
```

Use `WEBHOOK_VERIFY_TOKEN` as the verify token.

### Required Permissions for App Review:
- `instagram_basic`: Reading connected profile info and media.
- `instagram_manage_comments`: Receiving webhooks and reading comments.
- `instagram_manage_messages`: Sending automated DM replies (Comment-to-DM).
- `instagram_content_publish`: Publishing scheduled Reels, Carousels, Photos and Stories via Graph API.
- `pages_show_list` & `pages_read_engagement`: Managing linked Facebook Pages for Instagram Professional accounts.

