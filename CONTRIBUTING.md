# Contributing to BrandqoAI

Thanks for your interest in contributing to BrandqoAI! This project is built for and with creators and developers in the community.

These guidelines are here to make it easy to get started and to keep the project healthy as it grows.

## Ways to Contribute

- **Bug reports** – something doesn’t work as expected.
- **Feature requests** – ideas that make BrandqoAI more useful for creators.
- **Documentation** – improving README, guides, or comments.
- **Code contributions** – fixes, new features, tests, and refactors.

## Project Overview

At a high level, BrandqoAI consists of:

- `frontend/` – Next.js + TypeScript dashboard for calendar, brand settings, and account connections.
- `backend/` – Node.js + TypeScript API for WhatsApp webhooks, AI content generation, scheduling, and publishing workers.

For the detailed technical plan and architecture, see the project plan file under `.cursor/plans/`.

## Getting Set Up for Development

1. **Fork** the repository on GitHub and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/BrandqoAI.git
   cd BrandqoAI
   ```

2. **Create a feature branch**:

   ```bash
   git checkout -b feature/my-awesome-change
   ```

3. **Install dependencies**:

   ```bash
   # frontend
   cd frontend
   npm install

   # backend
   cd ../backend
   npm install
   ```

4. **Configure environment variables** (see `README.md` for required values).

5. **Run the apps**:

   - Backend: `npm run dev` inside `backend/`
   - Frontend: `npm run dev` inside `frontend/`

## Coding Guidelines

- **Language & stack**: TypeScript-first for both frontend and backend.
- **Style**:
  - Use the configured ESLint/Prettier setup (run `npm run lint` where available).
  - Keep functions small and focused where reasonable.
  - Prefer explicit types when they clarify intent.
- **Architecture**:
  - Keep WhatsApp, AI, scheduler, and social integrations in their own modules.
  - Avoid leaking low-level implementation details across module boundaries.

## Working on Issues

1. Look for issues labeled `good first issue` or `help wanted`.
2. Comment on the issue to say you are working on it.
3. If the change is larger, consider proposing an approach in the issue before coding.

If you’re proposing a larger feature, outline:

- **Problem** you’re solving.
- **High-level design** (data model, APIs, UX impact).
- **Migration/compatibility** concerns, if any.

## Commit Messages

- Make commits small and focused.
- Use descriptive messages, e.g.:
  - `feat: add basic WhatsApp onboarding flow`
  - `fix: handle expired Meta access tokens`
  - `docs: improve setup instructions`

## Pull Request Process

1. **Sync with main**:

   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   git checkout feature/my-awesome-change
   git rebase main
   ```

2. **Run tests and linters**:

   ```bash
   # frontend
   cd frontend
   npm test || npm run test
   npm run lint || true

   # backend
   cd ../backend
   npm test || npm run test
   npm run lint || true
   ```

3. **Open a PR** against the main repo:
   - Fill out the PR template.
   - Describe the change, how you tested it, and any follow-up work.

4. **Review & iterate**:
   - Be open to feedback and requested changes.
   - Keep discussions respectful and focused on the code.

## Code of Conduct

This project is governed by the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Questions?

If you have questions about where to start or how to implement something, feel free to:

- Open a **GitHub Discussion** (if enabled), or
- Ask in an existing issue.

We’re happy to help you get started.

