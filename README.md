# Promptly

A Duolingo-style app for learning AI: short lessons, work playbooks, copy-ready prompt templates and a scored business simulator.

| Track | Content |
| --- | --- |
| **AI foundations** | 7 lessons — what a model is, tokens and context, prompts that work, hallucinations, safe context, iteration, tools |
| **AI at work** | 5 lessons — task audit, outbound email, thread → decisions, one document → five formats, measuring a workflow. Role examples for sales, marketing, support, ops, engineering |
| **Prompt & code lab** | 6 templates with prompts, reference code and a ship checklist (Pro) |
| **Build with AI** | 5-round simulator, scored on the server across cash, reach and trust |

## Run it

[Bun](https://bun.sh) only — no Node required.

```bash
bun install
cp .env.example .env
bun run dev          # http://localhost:3111
```

`bun run build` / `bun run start` for production, `bun run typecheck` for types.

## Environment

| Variable | Purpose |
| --- | --- |
| `APP_ORIGIN` | Canonical origin: CORS allowlist, origin checks, Stripe redirects |
| `APP_SECRET` | Peppers every token hash. Required in production; a dev secret is generated under `data/` otherwise |
| `DATA_DIR` | SQLite database, uploads and the dev pepper (default `./data`) |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PLUS`, `STRIPE_PRICE_PRO`, `STRIPE_WEBHOOK_SECRET` | Billing. Unset in development → plans activate locally |
| `ADMIN_EMAILS` | Comma-separated allowlist; those accounts are admins (still need TOTP) |
| `DEV_SHOW_DEVICE_CODE` | Development only: echo the 4-digit device code back to the UI |

## Plans

| | Free | Plus $6.99/mo | Pro $15.99/mo |
| --- | --- | --- | --- |
| Foundations (7) | ✓ | ✓ | ✓ |
| Work lessons (5) | 1 | ✓ | ✓ |
| Simulator | 2 rounds | 5 rounds | 5 rounds |
| Lab templates (6) | — | — | ✓ |

Guests get the first two foundations lessons and their progress merges into the account they create.

## Auth

Email + password (scrypt), sessions and devices as opaque tokens in `httpOnly` cookies. A new device needs a 4-digit code (10 minutes, 5 attempts, single use). Admins need a confirmed TOTP authenticator, and every new admin device also needs the code. Details and limits: [SECURITY.md](./SECURITY.md).

## Layout

```
app/            pages + /api route handlers
  components/   client components (forms, lesson player, simulator)
content/        lessons, lab templates, simulator rounds (scores are server-only)
lib/            db, session, entitlements, validation, rate limits, stripe, crypto
types/bun.d.ts  types for Bun's built-in sqlite
data/           created at runtime and git-ignored
```

## Not built yet

Password reset and email verification, a cancellation screen (real subscriptions are managed in Stripe), and multi-instance uploads (files live on local disk today).
