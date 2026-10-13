# Roadmap

This roadmap is optimized for four goals:

1. Validate the product strategy around content-to-conversion.
2. Keep the public repo and product story coherent.
3. Avoid direct competition with mature tools like Buffer, Metricool, or Manychat.
4. Turn the stack into a campaign operating system for creators and businesses.

## Strategic Positioning

MeuPerfil should not be positioned as a generic social media manager or as a direct Manychat clone.

The correct direction is:

- Meuperfil is a content-to-conversion platform.
- The user publishes content.
- The system turns that attention into campaigns.
- Campaigns trigger engagement, DMs, links, leads, and eventually sales.

Core formula:

Content -> Engagement -> Conversation -> Click -> Lead -> Sale

This strategy brings together the three product layers already in the codebase:

- Campaigns: comment-to-DM automation
- Publish: scheduled content and publishing workflows
- Profile: bio link / link in bio / landing page experience

The product should be sold as a campaign engine, not as a list of disconnected features.

## Product Architecture

### 1. Campaigns (core product)

Campaigns are the unit of business value.

A campaign is a container with:

- objective
- content set
- CTA
- keywords
- DM automation
- tracked links
- landing page
- lead capture
- analytics and attribution

This is the heart of the product.

### 2. Publish

Publishing remains a useful module but should be secondary.

It exists to support the campaign lifecycle:

- schedule posts and reels
- build a content calendar
- attach campaign CTAs to publishing
- trigger campaign workflows from published content

This module should not be pitched as a competitive alternative to Buffer or Metricool.

### 3. Automations

Automation should be framed as conversion orchestration.

Examples:

- comment -> DM
- keyword -> reply
- DM -> link
- click -> landing page
- lead -> email capture
- follow-up sequence -> sale

### 4. Profile

The bio link / profile is not a commodity page.

It should become a dynamic landing page tied to a campaign, offer, or audience segment.

Examples:

- campaign landing page
- product-specific page
- lead magnet page
- creator profile page
- offer page for a paid campaign

## Roadmap by Execution Part

## Part 0: Product Repositioning

Goal: make the product story coherent before adding more features.

- Reframe README and landing pages around campaign conversion.
- Rename feature narratives so they support one system, not three products.
- Define "campaign" as the primary object in the product architecture.
- Add product messaging: "Turn every post into a campaign."
- Clarify the difference between campaign platform, scheduler, and bio-link experience.

## Part 1: Campaign Engine MVP

Goal: make the campaign the central object in the app.

- Add campaign dashboard and campaign creation flow.
- Attach campaigns to posts and reels.
- Support objective, CTA, keywords, DM message, and tracked links in one place.
- Link automation to campaign level, not only to a single post.
- Add campaign status and reporting overview.
- Add campaign templates for high-intent use cases.

## Part 2: Conversion Layer

Goal: tie engagement to measurable outcomes.

- Add campaign landing pages and offer URLs.
- Improve tracked link experience and attribution.
- Add lead capture and campaign-level conversion tracking.
- Support tags and campaign-level funnel states.
- Build a basic campaign analytics dashboard.

## Part 3: Publish + Campaign Integration

Goal: connect content creation to campaign execution.

- Integrate scheduled publishing with campaign context.
- Add post/reel-to-campaign attachment flow.
- Support automatic campaign creation after publication.
- Add content calendars with CTA-aware publishing.
- Build a simple "publish this content as a campaign" experience.

## Part 4: Automation & Lead Flow

Goal: go beyond comment-to-DM and create a conversion funnel.

- Add DM sequences and follow-up logic.
- Add lead tagging and stages.
- Support campaign logic by objective: lead, sale, waitlist, reservation, etc.
- Add trigger flows beyond comments.
- Create basic lead CRM primitives.

## Part 5: Attribution and ROI

Goal: answer the real user question: what content made money?

- Connect campaign content to comments, clicks, leads, and sales.
- Add content-level attribution by post/reel/story.
- Add campaign ROI summaries.
- Add shareable client reports by campaign.
- Add winner/loser analysis per content asset.

## Part 6: AI Campaign Copilot

Goal: turn the product into an execution layer, not only a tool.

- Generate campaign setup from objective and target offer.
- Suggest CTAs, keywords, DM flows, and landing pages.
- Recommend posts or reels for a campaign strategy.
- Analyze weak campaigns and suggest changes.
- Assist with messaging and funnel optimization.

## Part 7: Agency and Multi-Client Layer

Goal: make it viable for business use.

- Workspace segmentation by client or brand.
- Campaign templates by niche and offer type.
- Agency reporting and white-label capabilities.
- Lead and conversion dashboards per client.
- Shared campaign access and roles.

## Phase 0: Foundation

Status: merged through issue [#14](https://github.com/patricknasc/meuperfil/issues/14).

- Email magic-link auth.
- Workspace tenancy.
- Instagram account connection.
- Keyword campaigns.
- Meta webhook processing.
- BullMQ worker.
- Stripe subscriptions.
- Vercel cron.
- Landing page.
- Production deployment docs.

## Phase 1: Launch Readiness

Issue: [#7 Production readiness](https://github.com/patricknasc/meuperfil/issues/7)

- Resolve dependency audit issues or document safe exceptions.
- Make monthly usage and rate limits atomic under concurrency.
- Add worker health checks and operational alerts.
- Add admin diagnostics for webhook, billing, token, and worker failures.
- Add Privacy Policy, Terms, Data Deletion, and Meta App Review support pages.

## Phase 2: Campaign OS

Issue: [#8 Campaign OS repositioning](https://github.com/patricknasc/meuperfil/issues/8)

- Reposition automations as campaigns.
- Add campaign goals and outcomes.
- Improve onboarding around first campaign creation.
- Make dashboards more agency/client friendly.

## Phase 3: Viral Template Loop

Issue: [#9 Public campaign templates](https://github.com/patricknasc/meuperfil/issues/9)

- Add public template library.
- Add seeded templates for high-intent niches.
- Seeded niches: DTC, real estate, fitness, course sellers, beauty services,
  restaurants, events, and creators.
- Route "Use this template" into signup.
- Let users contribute templates.

## Phase 4: Proof Of ROI

Issues:

- [#10 Tracked links and analytics](https://github.com/patricknasc/meuperfil/issues/10) - done
- [#11 Shareable client reports](https://github.com/patricknasc/meuperfil/issues/11) - done

Planned work:

- Campaign tracked links.
- Click logging.
- CTR and outcome analytics.
- Public read-only campaign reports.
- Free-plan report branding and paid-plan unbranded reports.

## Phase 5: Agency Revenue Layer

Issues:

- [#12 Agency multi-account support](https://github.com/patricknasc/meuperfil/issues/12) - done
- [#13 Founding agency offer and referrals](https://github.com/patricknasc/meuperfil/issues/13) - done

Planned work:

- Multiple Instagram accounts per workspace.
- Workspace invites and roles.
- Agency plan limits.
- Founding agency offer.
- Referral program design.

## Phase 6: Search And Distribution

Issue: [#14 SEO landing pages](https://github.com/patricknasc/meuperfil/issues/14) - done

- Manychat alternative landing page.
- Instagram comment-to-DM templates page.
- Instagram DM automation for agencies page.
- Comment LINK automation page.

## Strategic Recommendation

Do not build toward "social media management" or "general Instagram automation" as a broad category.

Build toward this narrative:

- Turn content into campaigns.
- Turn campaigns into conversations.
- Turn conversations into leads and sales.

That is the clearest and most defensible angle for the product you already built.

## Future Vertical: Campaign OS for Organizations and Elections

This should be treated as a future horizontal vertical, not the primary launch narrative.

The main platform remains a content-to-conversion engine for creators, businesses, and agencies.

A political/election workspace could later reuse the same engine for:

- official candidate profile pages
- proposal pages and policy pages
- agenda and event content
- tracked campaign links and QR code pages
- team-based content and campaign management
- reporting by source, content, and conversion path
- compliance-oriented documentation and approval workflows

This is valuable because the operational model is the same:

Content -> Audience -> Information -> Action -> Measurement

### Important constraint

Election use cases require compliance and caution. This should not be built as an aggressive persuasion engine.

The safe scope is:

- public communication
- proposals and agenda content
- official profile / landing pages
- source tracking and content analytics
- team collaboration
- ad transparency and approval workflows

The unsafe scope is:

- automated persuasion by segment
- personalized political micro-targeting
- opaque or non-compliant ad flows
- broad voter data targeting or behavioral manipulation

This vertical is realistic only after the core product is clear and after compliance needs are defined for the target jurisdiction.

## Strategic Value of the Campaign OS Pattern

The broader architecture should be designed for multiple campaign types:

- commercial campaigns
- creator campaigns
- product launches
- events
- nonprofit campaigns
- institutional or political communication

The engine stays the same; the templates, rules, and compliance requirements change.

That is a much stronger product strategy than forcing the brand into a narrow Instagram-only story.
