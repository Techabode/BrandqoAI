# Contributing to BrandqoAI

Thanks for your interest in contributing to BrandqoAI! This project is built for and with creators and developers in the community.

These guidelines are here to make it easy to get started and to keep the project healthy as it grows. Please read this document fully before opening any issues or pull requests.

---

## Code of Conduct

All contributors are expected to maintain a professional and respectful working environment. Criticism should be directed at code and ideas, never at people. If you have a conflict with another contributor, raise it with the PM or Lead Developer directly.
This project is governed by the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

---

## How We Work

We work in sprints. All work is tracked as GitHub Issues. Every issue is assigned to a milestone that maps to a sprint. Developers pick up issues from the current sprint milestone. No work begins without a corresponding issue. All code changes go through a pull request — nothing is pushed directly to `main` or `develop`.

**Our tools:**

- **GitHub Issues** — task tracking and bug reporting
- **GitHub Projects** — sprint board (Kanban view)
- **GitHub Milestones** — sprint and release planning
- **Discord** — team communication
- **Visual Studio Code** — development(you can use any editor or IDE of your choice)

At a high level, BrandqoAI consists of:

- `frontend/` – Next.js + TypeScript dashboard for calendar, brand settings, and account connections.
- `backend/` – Node.js + TypeScript API for WhatsApp webhooks, AI content generation, scheduling, and publishing workers.

For the detailed technical plan and architecture, see the [Technical Requirements Documentation].

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

---
## Ways to Contribute

- **Bug reports** – something doesn’t work as expected.
- **Feature requests** – ideas that make BrandqoAI more useful for creators.
- **Documentation** – improving README, guides, or comments.
- **Code contributions** – fixes, new features, tests, and refactors.

---
## Getting Started

1. Read the [README.md] and follow the installation steps to get the project running locally.
2. Ask the PM or lead developer to be added to the GitHub repository with the appropriate role.
3. Ask to be added to the team communication channel (Discord).
4. Review the current open issues and the active milestone to understand what is in progress.
5. Do not begin work on any issue until it has been assigned to you.

---
## Branching Strategy

### Branch Structure

|Branch|Purpose|Who Can Push|
|---|---|---|
|`main`|Production-ready code only. Always deployable.|No one directly — merged from `develop` via PR only|
|`develop`|Integration branch. All features merge here first.|No one directly — merged from feature branches via PR only|
|`feature/[description]`|New feature development|Assigned developer|
|`fix/[description]`|Bug fix|Assigned developer|
|`hotfix/[description]`|Urgent fix applied directly to `main`|Lead developer only|
|`chore/[description]`|Refactoring, dependency updates, config changes|Assigned developer|
|`release/[version]`|Release preparation — final testing before merging to `main`|Lead developer only|

### Branch Naming Rules

- Use lowercase and hyphens only — no spaces, no underscores
- Keep it short and descriptive
- Always reference the issue number where possible

**Examples:**

```
feature/user-registration        ✓
feature/42-user-registration     ✓  (includes issue number — preferred)
fix/otp-expiry-bug               ✓
fix/101-otp-expiry-bug           ✓
chore/update-django-dependencies ✓
Feature/UserRegistration         ✗  (wrong case)
my-branch                        ✗  (no context)
```

### Creating a Branch

```bash
# Always branch from develop (not main)
git checkout develop
git pull origin develop
git checkout -b feature/[issue-number]-[short-description]
```

---

## Commit Message Format

### Format

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — issue references, breaking change notes]
```

### Types

|Type|When to Use|
|---|---|
|`feat`|A new feature|
|`fix`|A bug fix|
|`docs`|Documentation changes only|
|`style`|Formatting, missing semicolons — no logic change|
|`refactor`|Code restructuring — no feature change, no bug fix|
|`test`|Adding or updating tests|
|`chore`|Build process, dependency updates, config changes|
|`perf`|Performance improvements|

### Rules

- Subject line: 72 characters maximum
- Use the imperative mood — "Add feature" not "Added feature" or "Adds feature"
- Do not end the subject line with a period
- Reference the issue number in the footer

### Examples

```
feat(auth): add OTP verification on registration

Users must now verify their phone number or email via OTP
before their account is activated. Unverified accounts
expire after 24 hours.

Closes #42

---

fix(payments): prevent double charge on gateway timeout

When the payment gateway timed out, a retry was triggered
without checking whether the original charge had already
been processed. Added idempotency key to prevent duplicate
charges.

Closes #87

---

chore(deps): update Django to 4.2.1
```

---

## Opening Issues

**Before opening an issue:**

- Search existing issues to check if it already exists
- If it exists and is open, add a comment rather than opening a duplicate
- If it exists and is closed, reference it in your new issue

**Use the correct issue template:**

- 🐛 [Bug Report] — for reporting broken behaviour
- ✨ [Feature Request] — for proposing new functionality
- ✅ [Task] — for development tasks, chores, and non-bug work items

**Working on Issues**

1. Look for issues labelled `good first issue` or `help wanted`.
2. Comment on the issue to say you are working on it.
3. If the change is larger, consider proposing an approach in the issue before coding.

If you’re proposing a larger feature, outline:

- **Problem** you’re solving.
- **High-level design** (data model, APIs, UX impact).
- **Migration/compatibility** concerns, if any.

**Issue rules:**

- Every issue must be assigned to a milestone before development begins
- Every issue must have at least one label
- Every issue must have a clear acceptance criteria before it is moved to In Progress
- Issues without sufficient detail will be sent back to the reporter

---

## Pull Request Process

### Before Opening a PR

- [ ] Your branch is up to date with `develop`
- [ ] All acceptance criteria in the linked issue are met
- [ ] You have tested your changes locally
- [ ] All existing tests pass
- [ ] You have added tests for new functionality
- [ ] You have updated documentation if your changes affect it

### Opening the PR

1. Push your branch to the remote repository
2. Open a pull request against `develop` (not `main`)
3. Fill in the pull request template completely — do not leave sections blank
4. Link the related issue using `Closes #[issue-number]` in the PR description
5. Assign at least one reviewer
6. Add the appropriate labels

### PR Size Guidelines

Large PRs are harder to review and more likely to introduce bugs. Small, focused PRs are encouraged

- **Small** (preferred): Under 200 lines changed — single feature or fix
- **Medium**: 200–500 lines — acceptable for complex features
- **Large**: 500+ lines — must be discussed with the lead developer before opening; consider splitting

### Merging Rules

- A minimum of **1 approval(s)** is required before merging
- All CI checks must pass before merging
- The PR author merges their own PR after approval — not the reviewer
- Delete the branch after merging
- Do not merge your own PR without a review unless explicitly authorised by the lead developer

**Run tests and linters**:

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

3. **Open a PR** against the develop repo:
   - Fill out the PR template.
   - Describe the change, how you tested it, and any follow-up work.

4. **Review & iterate**:
   - Be open to feedback and requested changes.
   - Keep discussions respectful and focused on the code.

---

## Code Review Standards

### For Reviewers

- Review within 24 hours of being assigned
- Focus on logic, security, and maintainability — not style (that is what linters are for)
- Be specific in feedback — point to the exact line and explain why it is a concern
- Distinguish between blocking issues ("This must be fixed") and suggestions ("This could be improved")
- Approve only when you would be comfortable deploying this code to production

### For Authors

- Respond to all review comments before requesting a re-review
- If you disagree with feedback, explain why — do not silently ignore it
- Do not make unrelated changes in a PR that is under review

### What Reviewers Check

- [ ] Does the code do what the linked issue describes?
- [ ] Are all acceptance criteria met?
- [ ] Are there security concerns — unvalidated inputs, exposed secrets, broken access control?
- [ ] Is error handling complete?
- [ ] Are edge cases handled?
- [ ] Is the code readable and reasonably documented?
- [ ] Are there tests for the new functionality?

---

## Definition of Done

An issue is only considered **Done** when all of the following are true:

- [ ] All acceptance criteria in the issue are met and verified
- [ ] Code has been reviewed and approved
- [ ] All tests pass in the CI pipeline
- [ ] The feature works correctly in the staging environment
- [ ] No new bugs have been introduced (verified by QA if applicable)
- [ ] Documentation has been updated if the change affects how the system is used
- [ ] The PR has been merged and the branch deleted
- [ ] The issue has been closed and linked to the merged PR

---

## Deployment Process



|Environment|Branch|Who Deploys|When|
|---|---|---|---|
|Development|`develop`|Automatic (CI/CD)|On every merge to `develop`|
|Staging|`release/[version]`|Lead Developer|Before each release|
|Production|`main`|Lead Developer|After PM and QA sign-off|

**Production deployments require:**

1. PM sign-off confirming the release scope is complete
2. QA or Lead Developer sign-off confirming all features pass in staging
3. Lead developer executing the deployment checklist in the TRD

No production deployment happens without both sign-offs documented.

---

## Getting Help

If you need help or have questions about where to start or how to implement something, feel free to:

- Open a **GitHub Discussion**(if enabled)
- Ask in an existing issue
- **Stuck on a technical problem?** Post in `#general` channel on Discord — do not sit blocked for more than 2 hours without asking for help
- **Unclear on a requirement?** Comment directly on the GitHub Issue and tag the PM
- **Found a security vulnerability?** Do not open a public issue — contact  or email PM or Lead Developer directly immediately
- **Process question?** Contact the PM via Discord

---

_CONTRIBUTING.md — BrandqoAI_ _Maintained by the Product Manager and Lead Developer_
