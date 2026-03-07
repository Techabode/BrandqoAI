# BrandqoAI Roadmap

This roadmap summarizes the main phases and milestones for BrandqoAI. It mirrors the more detailed technical plan in the `.cursor/plans` directory but is written for contributors and the community.

Status indicators (suggested):

- ✅ Done
- 🛠 In progress
- 📝 Planned

## Phase 1 – Foundations & Auth 🛠

**Goal**: Establish the basic frontend and backend scaffolding, authentication, and database connection.

- 🛠 Set up `frontend/` (Next.js + TypeScript) and `backend/` (Node.js + TypeScript).
- 📝 Configure linting, formatting, and basic CI.
- 📝 Implement backend auth (JWT-based or similar).
- 📝 Hook up PostgreSQL via Prisma (or chosen ORM).

## Phase 2 – WhatsApp Integration & Basic AI 📝

**Goal**: Make it possible for a creator to onboard and get simple AI-generated content via WhatsApp.

- 📝 Configure WhatsApp Business Cloud API webhook endpoint.
- 📝 Implement a minimal conversation state machine for onboarding:
  - Brand name and niche.
  - Target audience.
  - Tone of voice and content pillars.
- 📝 Implement basic `contentService`:
  - Use an LLM to generate a few captions and image prompts given a brand profile and simple user request.
- 📝 Reply to users in WhatsApp with generated content (no scheduling yet).

## Phase 3 – Web Dashboard & Social Connections 📝

**Goal**: Give creators a visual dashboard and let them connect their social accounts.

- 📝 Build frontend pages:
  - `dashboard` – simple overview and upcoming posts.
  - `calendar` – monthly/weekly content calendar.
  - `settings/brand` – brand profile editing.
  - `settings/accounts` – connect/disconnect accounts.
- 📝 Implement OAuth for:
  - Instagram/Facebook (Meta Graph APIs).
  - X/Twitter (as available and feasible).
- 📝 Store encrypted tokens and display connection status in the UI.

## Phase 4 – Scheduling Engine & Posting 📝

**Goal**: Turn approved content into scheduled posts and publish them automatically.

- 📝 Define models:
  - `PostTemplate`
  - `ScheduledPost`
- 📝 Implement `schedulerService` to:
  - Turn approved templates into posts assigned to time slots.
  - Enqueue publishing jobs into Redis via BullMQ (or similar).
- 📝 Implement publishing workers to:
  - Post to Instagram/Facebook via the Meta APIs.
  - Post to X/Twitter via their API (subject to access/limits).
- 📝 Wire the calendar UI to live scheduled data.

## Phase 5 – Poster Generation & UX Polish 📝

**Goal**: Improve creative quality and user experience across WhatsApp and the dashboard.

- 📝 Integrate `posterService` with an image generation API or template engine.
- 📝 Show image/poster previews in:
  - WhatsApp messages (where supported).
  - Web dashboard.
- 📝 Polish conversational flows:
  - Quick replies and prompts.
  - Clear summaries of upcoming content per platform.
- 📝 Add basic analytics (if API access allows):
  - Post counts by platform.
  - Simple engagement stats.

## Phase 6 – Hardening & Launch Prep 📝

**Goal**: Make the system stable, safe, and ready for real creators.

- 📝 Add validation, logging, and error handling across integrations.
- 📝 Implement rate limiting and basic security controls.
- 📝 Add onboarding flows in the dashboard.
- 📝 Write setup and operator docs (WhatsApp, Meta, X/Twitter, AI providers).
- 📝 Run a small beta with real creators and incorporate feedback.

## How to Use This Roadmap

- Maintainers can convert bullets into GitHub issues and link them back to this document.
- Contributors can:
  - Look at the current phase.
  - Find matching issues.
  - Propose additional tasks in issues or discussions if something is missing.

