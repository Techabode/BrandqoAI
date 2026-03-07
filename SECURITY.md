# Security Policy

## Supported Versions

BrandqoAI is in active early development. Until a 1.0.0 release, security support is on a **best-effort** basis for the main branch.

## Reporting a Vulnerability

If you discover a security vulnerability in BrandqoAI or its dependencies:

1. **Do not** open a public GitHub issue describing the vulnerability in detail.
2. Instead, please contact the maintainer privately (for now, refer to the contact information in the repository description or maintainer profile).

When reporting, please include:

- A description of the issue and its impact.
- Steps to reproduce, if possible.
- Any relevant logs or configuration details (redact secrets).

We will:

- Acknowledge receipt of your report as soon as possible.
- Investigate the issue and determine its severity.
- Work on a fix and a coordinated disclosure plan if needed.

## Handling Secrets

As a contributor:

- **Never commit secrets** (API keys, tokens, passwords) to the repository.
- Use `.env` files locally and ensure they are listed in `.gitignore`.
- If you accidentally commit a secret, rotate it immediately and contact the maintainer.

## Third-party Integrations

BrandqoAI integrates with:

- WhatsApp Business Cloud API.
- Meta Graph API (Instagram/Facebook).
- X/Twitter APIs.
- AI providers.

When configuring these:

- Use least-privilege access where possible.
- Consider using dedicated testing/sandbox accounts.
- Keep access tokens and credentials secure and rotate them regularly.

