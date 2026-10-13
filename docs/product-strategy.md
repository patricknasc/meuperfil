# MeuPerfil — Product Strategy and Execution Plan

This document consolidates the product positioning, pitch, roadmap, dashboard structure, and implementation order discussed in the current strategy sessions.

It is the canonical place for the current product direction.

## 1) Product strategy

### Core positioning

MeuPerfil should not be positioned as:

- a generic social media manager
- a direct Manychat alternative
- a simple Linktree clone
- a full social media suite

The correct positioning is:

- Content-to-Conversion Platform
- Campaign OS
- Platform for turning content into measurable conversion

### Core promise

Turn every post into a campaign.

### Product formula

Content -> Engagement -> Action -> Conversion

### Core user value

- publish content
- direct engagement
- trigger conversations
- capture leads
- track conversions
- optimize performance

### Core narrative

MeuPerfil helps creators, businesses, and teams turn attention into measurable results without stitching together multiple disconnected tools.

---

## 2) Pitch deck

### Slide 1 — The problem

You publish content, but you do not know how to turn attention into revenue.

Problems:

- content is spread across several tools
- CTA is unclear or inconsistent
- comments are not converted into leads
- there is no direct link from content to action
- performance is hard to measure

### Slide 2 — The solution

MeuPerfil transforms content into campaigns.

Instead of managing multiple tools separately, the user creates a campaign with:

- objective
- CTA
- content
- automation
- tracked links
- landing page
- performance metrics

### Slide 3 — How it works

Publish -> Engage -> Convert

1. User creates a campaign
2. Sets objective and CTA
3. Connects the content asset
4. Activates automation
5. Adds tracked link or landing page
6. Monitors clicks, DMs, and conversion

### Slide 4 — Why it is different

MeuPerfil is not:

- a scheduler
- a generic chatbot platform
- a link tree

It is the layer that connects:

- content
- engagement
- automation
- conversion
- attribution
- reporting

### Slide 5 — Value and outcome

The user gets:

- more leads from existing content
- more measurable campaign performance
- a clear source of conversion
- less manual operational work
- better campaign optimization over time

---

## 3) Product architecture

### Main object

Campaign is the central object in the system.

A campaign is the unit of value and should hold:

- objective
- CTA
- associated content
- automation rules
- tracked links
- landing page
- leads
- analytics
- reporting

### High-level structure

- Workspace
  - Profile / Bio Link
  - Campaigns
    - Content
    - CTA
    - Automation
    - Landing Pages
    - Links
    - Leads
    - Reports
  - Publish / Scheduler
  - Analytics
  - Team / Roles
  - Templates

### Value flow

Content -> Engagement -> CTA -> Action -> Conversion -> Measurement

---

## 4) Dashboard structure

### 1. Dashboard principal

Sections:

- active campaigns
- overall performance
- clicks and DM volume
- recent leads
- campaign-by-objective breakdown
- alerts and operational issues

### 2. Campaigns

Sections:

- campaign list
- status
- goal
- CTA
- clicks
- DM volume
- links
- actions: create, edit, pause, duplicate, delete

### 3. Campaign detail

Sections:

- Overview
- Content
- Automation
- Links
- Landing page
- Leads
- Reports

This is the most important page because it makes the campaign the center of the product.

### 4. Content

Sections:

- posts
- reels
- stories
- scheduled content
- linked campaign
- CTA per content item

### 5. Automations

Examples:

- comment -> DM
- keyword -> response
- DM -> link
- click -> landing page
- follow-up flow

### 6. Links and landing pages

Sections:

- tracked links
- QR code pages
- landing page by campaign
- source attribution
- CTR analytics

### 7. Leads

Sections:

- lead list
- tags
- origin
- campaign association
- lead status
- interaction history

### 8. Reports

Sections:

- campaign performance
- content performance
- lead conversion
- CTR and source attribution
- shareable reports
- ROI summary

---

## 5) Product backlog in order

### Phase 1 — Repositioning the product

- define campaign as the central object
- update messaging and landing copy
- remove mixed positioning from the product story
- define initial audience: creators, experts, small businesses

### Phase 2 — Campaign core

- create campaign
- edit campaign
- pause / activate
- duplicate campaign
- campaign status
- campaign objective and CTA
- campaign templates

### Phase 3 — Campaign detail page

- overview section
- content section
- automation section
- links section
- landing section
- leads section
- report section

### Phase 4 — Content and calendar

- publish and schedule content
- associate content with campaign
- CTA by content item
- publish with campaign context

### Phase 5 — Conversion layer

- tracked links
- landing pages
- QR code handling
- source attribution
- click count and CTR

### Phase 6 — Automation layer

- comment -> DM
- keyword -> response
- DM -> link
- click -> landing page
- follow-up logic
- logs and retries

### Phase 7 — Lead layer

- capture leads
- status and tags
- campaign source
- filtering and search
- lead history

### Phase 8 — Reporting and ROI

- campaign analytics
- content attribution
- lead conversion
- shareable reports
- ROI calculation

### Phase 9 — AI and expansion

- campaign generation suggestions
- CTA suggestions
- landing optimization
- templates by niche
- expansion to new verticals

---

## 6) What we already have and can reuse

### Already implemented and immediately useful

- dashboard navigation in [components/sidebar.tsx](components/sidebar.tsx)
- campaign list page in [app/[lang]/(dashboard)/campaigns/page.tsx](app/[lang]/(dashboard)/campaigns/page.tsx)
- core campaign models in [prisma/schema.prisma](prisma/schema.prisma)
- scheduled content model in [prisma/schema.prisma](prisma/schema.prisma)
- profile / bio-link model in [prisma/schema.prisma](prisma/schema.prisma)

### Strongly reusable pieces

- workspace structure
- campaigns table and domain
- automation model
- DM log and tracking model
- tracked links
- analytics base
- navigation and dashboard shell

### Needs improvement

- campaign detail page should become the main experience
- content should be first-class within the campaign
- landing page and links should be campaign-specific
- reporting should be designed around conversion and ROI
- product messaging should be aligned to the campaign narrative

---

## 7) Strategic recommendation

Do not build toward social media management as a broad generic product.

Do build toward:

- Campaign as the center of the product
- Content as engagement source
- Automation as conversion engine
- Links and landing pages as action layer
- Reporting as ROI layer

This is the clearest direction for what the project already contains.

---

## 8) Final product statement

MeuPerfil is a platform for turning content into campaigns, conversations, leads, and measurable conversion.

It is not just a scheduler. It is not just a DM automation tool. It is not just a link page.

It is a campaign operating system for creators, brands, and businesses that want more than social presence: they want conversion.
