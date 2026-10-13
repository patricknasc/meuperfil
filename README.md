# MeuPerfil

Open-source Instagram comment-to-DM campaign OS for businesses, creators, and agencies.

MeuPerfil turns comments like `LINK`, `PRICE`, or `GUIDE` into Meta-compliant private replies. The core engine is MIT licensed and self-hostable. The hosted SaaS layer is being built for agencies that want campaign templates, analytics, client reports, and managed reliability.

[Templates](app/templates) | [Roadmap](ROADMAP.md) | [Pitch](docs/pitch.md) | [Product strategy](docs/product-strategy.md) | [Campaign verticals](docs/campaign-os-verticals.md) | [Deployment](DEPLOYMENT.md) | [Referral plan](docs/referral-program.md) | [Production readiness](docs/production-readiness.md) | [Contributing](CONTRIBUTING.md) | [Security](SECURITY.md) | [Open-core model](docs/open-core.md)

## Pitch

### MeuPerfil is a content-to-conversion platform

We help creators, brands, and businesses turn attention into measurable action.

Instead of managing isolated tools for social posting, DM automation, and bio links, MeuPerfil connects the whole journey:

Content -> Engagement -> CTA -> Conversation -> Lead -> Conversion

We are not a generic social media manager, and we are not trying to be a direct clone of mature tools like Buffer or Manychat.

Our focus is to help every post become a campaign:

- publish content
- capture engagement
- trigger automated conversations
- send tracked links
- collect leads
- measure conversion and ROI

### Positioning

MeuPerfil = campaign OS for content-driven growth.

The product should be sold as:

- Content-to-Conversion Platform
- Campaign OS
- Turn every post into a campaign

### The core promise

Transform followers into clients automatically.

---

## Why This Exists

Instagram comment-to-DM is one of the clearest social-commerce loops:

```text
Customer comments "LINK" on a post or reel
Meta sends a webhook
MeuPerfil matches the keyword
The worker sends a private reply using the comment ID
The business gets a warm conversation
```

Most tools in this market are broad chatbot platforms. MeuPerfil is intentionally narrower: a focused campaign operating system for Instagram comment-triggered DMs.

## Current Product

- Email magic-link signup with workspace tenancy.
- Instagram professional account connection as an integration.
- Keyword campaigns for posts and reels.
- Meta webhook verification and event storage.
- BullMQ worker for private reply delivery.
- Idempotent DM logs per campaign/comment.
- Atomic monthly usage reservations and Redis-backed hourly DM reservations.
- Stripe Checkout, Customer Portal, and subscription webhooks.
- Plan limits for campaigns and monthly DMs.
- Vercel cron for token refresh and usage maintenance.
- Health checks and authenticated production diagnostics.
- Public Privacy, Terms, Data Deletion, and Meta App Review support pages.
- Public campaign template library.
- Tracked redirect links with click, CTR, and keyword analytics.
- Shareable read-only client report pages.
- Agency-ready multi-account workspaces with member roles and invite links.
- Production deployment docs for Vercel, Railway, Postgres, and Redis.

## Demo

The landing page is available locally at:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

Screenshots and GIFs are planned in issue [#17](https://github.com/patricknasc/meuperfil/issues/17). Good launch assets to add:

- Landing page hero screenshot.
- Dashboard overview screenshot.
- Campaign builder screenshot.
- Logs page screenshot.
- 30 second "comment LINK -> private reply" demo GIF using a Meta test account.

## Hosted SaaS

The hosted product will focus on agencies and campaign teams:

- Managed Vercel/Railway infrastructure.
- Public campaign templates.
- Tracked links and click analytics.
- Shareable client reports.
- Multi-account agency workspaces.
- Founding agency offer and referral-program plan.
- SEO landing pages for high-intent Instagram DM automation searches.
- Priority support and onboarding.

The core remains public so builders can self-host, audit, fork, and contribute.

## Rodar localmente (atalho)

Com Node 24 e Docker Desktop instalados:

```bash
./iniciar-local.sh          # Docker, .env, dependências, migrations, app e worker
./iniciar-local.sh parar    # desliga Postgres e Redis
```

O script usa a primeira porta livre a partir de 3000 e mostra o link de login no terminal.
Ambientes DS/HM/PD: [docs/environments.md](docs/environments.md).

## Self-Host Quick Start

### Requirements

- Node.js 24
- PostgreSQL
- Redis
- Meta Developer App
- Instagram Business or Creator account
- Resend account for magic-link email
- Stripe account for subscriptions

### Install

```bash
git clone https://github.com/patricknasc/meuperfil.git
cd meuperfil
npm install
```

### Start Services

```bash
npm run services:up
```

### Configure Environment

```bash
cp .env.example .env
```

Fill in all required values:

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

Generate `ENCRYPTION_KEY` with:

```bash
openssl rand -hex 32
```

### Database

```bash
npm run db:generate
npm run db:migrate
```

### Run Web And Worker

```bash
npm run dev
npm run worker
```

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Roadmap

The public launch roadmap is tracked in GitHub issues:

- [#7 Production readiness](https://github.com/patricknasc/meuperfil/issues/7) - done
- [#8 Campaign OS repositioning](https://github.com/patricknasc/meuperfil/issues/8) - done
- [#9 Public campaign templates](https://github.com/patricknasc/meuperfil/issues/9) - done
- [#10 Tracked links and analytics](https://github.com/patricknasc/meuperfil/issues/10) - done
- [#11 Shareable client reports](https://github.com/patricknasc/meuperfil/issues/11) - done
- [#12 Agency multi-account support](https://github.com/patricknasc/meuperfil/issues/12) - done
- [#13 Founding agency offer and referrals](https://github.com/patricknasc/meuperfil/issues/13) - done
- [#14 SEO landing pages](https://github.com/patricknasc/meuperfil/issues/14) - done

See [ROADMAP.md](ROADMAP.md) for the grouped plan.

## Good First Issues

Want to help? Start with the public issue list:

- [Good first issues](https://github.com/patricknasc/meuperfil/issues?q=is%3Aissue+is%3Aopen+label%3Atype%3Agood-first-issue)
- [Documentation issues](https://github.com/patricknasc/meuperfil/issues?q=is%3Aissue+is%3Aopen+label%3Atype%3Adocs)
- [Template issues](https://github.com/patricknasc/meuperfil/issues?q=is%3Aissue+is%3Aopen+label%3Aarea%3Atemplates)

If you build a campaign template that works for your niche, open an issue or pull request.

## Development Checks

Every pull request should pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Community

- Use GitHub Issues for bugs, roadmap tasks, and feature requests.
- Use GitHub Discussions for launch ideas, self-hosting questions, and campaign templates.
- Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).

The open-source core is MIT licensed. The hosted SaaS, managed infrastructure, support, and future agency features are monetized separately. See [docs/open-core.md](docs/open-core.md).
