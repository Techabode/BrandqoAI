# BrandqoAI

An AI-powered WhatsApp assistant and dashboard that helps creators plan, generate and schedule on-brand content to Instagram, Facebook and X/Twitter.

---

## Overview

Many small businesses struggle to maintain a consistent and engaging presence on social media. BrandqoAI solves this by acting as an always-on social media manager. Business owners simply register their details and connect their accounts, and the AI handles the rest, from generating an editable content calendar to automatically designing on-brand flyers and publishing posts based on a set schedule.

---

## Features

- **WhatsApp creator bot**: Chat-first onboarding and content generation in WhatsApp.
- **Brand-aware AI**: Captures your brand voice, audience, and content pillars to guide all output.
- **Content & poster generation**: Creates post ideas, captions, and poster prompts (or full images via an image API).
- **Multi-platform scheduling**: Schedule posts to Instagram, Facebook, and X/Twitter from one place.
- **Web dashboard**: Calendar view, brand preferences, and social account management.

---

## Tech Stack

| Layer             | Technology                                                                         |
| ----------------- | ---------------------------------------------------------------------------------- |
| Frontend — Web    | Next.js + TypeScript web dashboard (calendar, settings, account connections).      |
| Frontend — Mobile | _[e.g. React Native]_                                                              |
| Backend           | Node.js + TypeScript API (WhatsApp webhook, AI orchestration, scheduling workers). |
| Database          | _[e.g. PostgreSQL]_                                                                |
| Cache             | _[e.g. Redis]_                                                                     |
| File Storage      | _[e.g. AWS S3 / MinIO]_                                                            |
| Task Queue        | _[e.g. Celery]_                                                                    |
| CI/CD             | _[e.g. GitHub Actions]_                                                            |
| Hosting           | _[e.g. AWS / DigitalOcean / Contabo]_                                              |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **PostgreSQL** database
- **Redis** instance (for scheduled jobs)
- A Meta developer account (for WhatsApp Business Cloud API & Meta Graph APIs)

### Installation

#### 1. Clone the repository

```bash

git clone https://github.com/Techabode/BrandqoAI.git
cd BrandqoAI
```

#### 2. Install dependencies

```bash
# Backend
cd ../backend
npm install

# Frontend
cd frontend
npm install
```

#### 3. Set up environment variables

In `backend/`, create a `.env` file:

```bash
cp .env.example .env
# Open .env and fill in the required values
```

#### Environment Variables

| Variable                                           | Description                                                        | Required                     |
| -------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------- |
| `DATABASE_URL`                                     | PostgreSQL connection string                                       | Yes                          |
| `JWT_SECRET`                                       | Secret for backend auth                                            | Yes                          |
| `AI_PROVIDER`                                      | AI provider: `mistral` (default, cheapest) or `claude` (premium)   | No (defaults to mistral)     |
| `TOGETHER_API_KEY`                                 | Together AI API key for Mistral 7B (~$0.003 per 1K tokens)         | Yes if `AI_PROVIDER=mistral` |
| `ANTHROPIC_API_KEY`                                | Anthropic API key for Claude Sonnet (~$0.003 per 1K tokens input)  | Yes if `AI_PROVIDER=claude`  |
| `REPLICATE_API_KEY`                                | Replicate API key for Stable Diffusion image generation (optional) | No                           |
| `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_BUSINESS_TOKEN` | WhatsApp Business Cloud API credentials                            | Yes                          |
| `META_APP_ID`, `META_APP_SECRET`                   | Meta Graph API credentials                                         | Yes                          |
| `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`       | For X/Twitter integration                                          | Optional                     |

Before you can use the API you must migrate the schema into your database. The project uses
Prisma migrations, which are stored in `backend/prisma/migrations`.

A helper make command bootstraps the initial migration for you, so you never need to call
`npx prisma` manually. Run this once when you first clone the repo:

```bash
# on your host machine, after installing backend dependencies
make migrate-init
```

This will generate and apply the first migration to whatever database `DATABASE_URL` points at
(defaults to `localhost:5442` used by `make up-db`).

After the migration files exist you can bring up the app in Docker. Because the migration
directory must be copied into the image, rebuild the backend before deploying the migrations:

```bash
make build          # include migrations in image
make migrate        # apply them inside the backend container
```

The `User` table (and all others) will then be present and the registration endpoint will work.

`make migrate` is safe to run repeatedly; it will say "No pending migrations to apply" if the
database is already up to date.

When you want some demo data in the database you can invoke the seeding target:

```bash
make seed   # runs `prisma db seed` inside the backend container
```

(Seeding is configured in `prisma.config.ts` and the command uses the TypeScript
script under `prisma/seed.ts`.)

#### AI Provider Configuration 🤖

BrandqoAI supports multiple LLM providers for cost and quality optimization. By default, it uses **Mistral 7B via Together AI** (cheapest), but you can switch to **Claude Sonnet** by setting an environment variable.

**Cost Comparison:**

- **Mistral 7B (default)**: ~$0.003 per 1K input tokens (via Together AI)
- **Claude Sonnet (premium)**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens (via Anthropic)

**Setup:**

```bash
# Use Mistral 7B (default, cheapest)
AI_PROVIDER=mistral
TOGETHER_API_KEY=sk-together-...

# OR use Claude Sonnet (switch if needed)
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

The provider is selected at runtime based on the `AI_PROVIDER` environment variable. The corresponding API key must be provided in your `.env` file.

In `frontend/`, create a `.env.local` file for any public/front-end configuration (API base URL, etc.).

#### 4. Run the apps

From `backend/` and `frontend/` respectively:

```bash
npm run dev
```

Then open the dashboard at `http://localhost:3000`.

> **API docs**: While the backend is running you can view the Swagger UI at `http://localhost:4000/docs/`.
>
> To regenerate the raw OpenAPI specification (used by the UI), run:
>
> ```bash
> make docs      # invokes `npm run docs:generate` inside the backend
> ```
>
> This uses [swagger-autogen](https://www.npmjs.com/package/swagger-autogen) to
> scan your route files and output `backend/src/docs/swagger-output.json`.
>
> _Tip_: run `make docs` after adding or changing any endpoints so the
> specification stays in sync.
>
> You do **not** need to write any JSDoc comments – the autogen tool infers paths,
> parameters and responses automatically. Manual comments are still fine for
> adding descriptions or examples.

---

## Project Structure

```
BrandqoAI/
├── backend/              # Node.js backend application
│   ├── prisma/
│   ├── src/
├── frontend/             # Next.js web application
│   ├── pages/
│   └── styles/
├── .github/              # GitHub Actions workflows and issue templates
│   ├── workflows/
│   └── ISSUE_TEMPLATE/
├── CONTRIBUTING.md
├── docker-compose.yml    # Docker setup (if applicable)
└── README.md
```

---

## Contributing

We welcome contributions from the team. Please read:

- [CONTRIBUTING.md] how to set up your environment, coding standards, and the contribution process before opening any issues or pull requests.
- [`CODE_OF_CONDUCT.md`] – expected behavior in the community.

**Quick rules:**

- All work must be tracked in a GitHub Issue before development starts
- Branch naming: `feature/short-description`, `fix/short-description`, `chore/short-description`
- All pull requests require at least one reviewer approval before merging
- Do not push directly to `main` or `develop`
- You can start with issues labelled `good first issue` or `help wanted`/

---

## Project Roadmap

High-level roadmap lives in [`ROADMAP.md`](ROADMAP.md). It follows these phases:

1. **Foundations & Auth** – core backend/frontend scaffolding and auth.
2. **WhatsApp & basic AI** – onboarding flow and simple content generation.
3. **Dashboard & social connections** – web UI and OAuth integrations.
4. **Scheduling & posting engine** – queues and workers for post publishing.
5. **Poster generation & UX polish** – better creatives and smoother flows.
6. **Hardening & launch** – testing, logging, and beta feedback.

See [CHANGELOG.md] for the full version history.

---

## Team

| Role                    | Name  | GitHub         |
| ----------------------- | ----- | -------------- |
| Product/Project Manager | PADIO | @MADEPADIO     |
| Lead Developer          | Henry | @ezeanyimhenry |

---

## License

BrandqoAI is open source under the [MIT License].

## Community

- **Issues**: Use GitHub Issues for bugs and feature requests.
- **Discussions** (optional): If enabled, use GitHub Discussions for ideas and Q&A.
- **Security**: Please see [`SECURITY.md`] for how to report vulnerabilities.

---

_README — BrandqoAI_ _Last updated: 9th March 2026_
