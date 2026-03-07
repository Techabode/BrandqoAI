# BrandqoAI

AI-powered WhatsApp assistant and dashboard that helps creators plan, generate, and schedule on-brand content to Instagram, Facebook, and X/Twitter.

## Features

- **WhatsApp creator bot**: Chat-first onboarding and content generation in WhatsApp.
- **Brand-aware AI**: Captures your brand voice, audience, and content pillars to guide all output.
- **Content & poster generation**: Creates post ideas, captions, and poster prompts (or full images via an image API).
- **Multi-platform scheduling**: Schedule posts to Instagram, Facebook, and X/Twitter from one place.
- **Web dashboard**: Calendar view, brand preferences, and social account management.

## Project Structure

- `frontend/` – Next.js + TypeScript web dashboard (calendar, settings, account connections).
- `backend/` – Node.js + TypeScript API (WhatsApp webhook, AI orchestration, scheduling workers).

## Getting Started (Local Development)

### Prerequisites

- **Node.js** 18+ and **npm**
- **PostgreSQL** database
- **Redis** instance (for scheduled jobs)
- A Meta developer account (for WhatsApp Business Cloud API & Meta Graph APIs)

### Clone and install

```bash
git clone https://github.com/<your-org-or-username>/BrandqoAI.git
cd BrandqoAI

# Install frontend
cd frontend
npm install

# Install backend
cd ../backend
npm install
```

### Environment configuration

In `backend/`, create a `.env` file:

```bash
cp .env.example .env
```

Then set at least:

- `DATABASE_URL` – PostgreSQL connection string
- `REDIS_URL` – Redis connection URL
- `JWT_SECRET` – secret for backend auth
- `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_BUSINESS_TOKEN`
- `META_APP_ID`, `META_APP_SECRET`
- `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` (optional, for X/Twitter integration)
- Any AI provider keys (e.g., `OPENAI_API_KEY` or similar)

In `frontend/`, create a `.env.local` file for any public/front-end configuration (API base URL, etc.).

### Run the apps

From `backend/`:

```bash
npm run dev
```

From `frontend/`:

```bash
npm run dev
```

Then open the dashboard at `http://localhost:3000`.

## Contributing

Contributions are very welcome! Please read:

- [`CONTRIBUTING.md`](CONTRIBUTING.md) – how to set up your environment, coding standards, and the contribution process.
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) – expected behavior in the community.

You can start with issues labeled `good first issue` or `help wanted`.

## Project Roadmap

High-level roadmap lives in [`ROADMAP.md`](ROADMAP.md). It follows these phases:

1. **Foundations & Auth** – core backend/frontend scaffolding and auth.
2. **WhatsApp & basic AI** – onboarding flow and simple content generation.
3. **Dashboard & social connections** – web UI and OAuth integrations.
4. **Scheduling & posting engine** – queues and workers for post publishing.
5. **Poster generation & UX polish** – better creatives and smoother flows.
6. **Hardening & launch** – testing, logging, and beta feedback.

## License

BrandqoAI is open source under the [MIT License](LICENSE).

## Community

- **Issues**: Use GitHub Issues for bugs and feature requests.
- **Discussions** (optional): If enabled, use GitHub Discussions for ideas and Q&A.
- **Security**: Please see [`SECURITY.md`](SECURITY.md) for how to report vulnerabilities.

