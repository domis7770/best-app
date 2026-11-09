# Security

What was asked for, where it lives, and the honest limit of each measure.

| Requirement | Implementation |
| --- | --- |
| **No API keys in the frontend** | Stripe keys are read only in `lib/stripe.ts` and `app/api/billing/*`. `lib/client.ts` — the only module browser components import — has no env access and no secrets. The device code is echoed to the client only in development. |
| **Row-level security** | SQLite has no native RLS, so every query filters by the server-resolved actor: `WHERE id = ? AND user_id = ?`. Ownership is part of the `WHERE` clause, not a separate check (see `lib/progress.ts`, `lib/sim.ts`, `app/api/uploads/[id]`). |
| **Server permissions** | Plan and role decisions come from `getActor()` + `lib/entitlements.ts` on every page and handler. Nothing is decided in the browser. Admin routes require `is_admin = 1` **and** `totp_confirmed = 1`. |
| **Browser IDs not trusted** | No handler accepts `userId`, `plan` or `isAdmin` from the request. Zod schemas strip unknown keys; ownership comes from the session cookie only. |
| **Rate limits** | `lib/ratelimit.ts`, fixed windows in SQLite: signup 6/h, login 20/15min per network and 8/15min per email, device code 15/10min, TOTP 10/10min, guest 12/h, progress 240/min, checkout 12/10min, upload 20/h. Accounts lock for 15 min after 6 failed passwords. |
| **Input validation** | `parseJson` + strict zod schema per route (`lib/validation.ts`). JSON only (`415`), 16 KB cap (`413`), email/lesson/plan enums, generic errors. |
| **No raw SQL** | Every statement uses bound `?` parameters; schema DDL is the only string passed to `exec`. |
| **No `.env` in git** | `.gitignore` excludes `.env`, `.env.*`, `data/`, `.next/`, with `!.env.example`; the example holds placeholders only. |
| **Real auth** | scrypt password hashes with per-user salt, equal-cost failure for unknown emails, peppered SHA-256 token hashes in the DB, 30-day sessions, single-use 10-minute device codes with attempt counters. First-party rather than a vendor SDK: no client secret anywhere. |
| **No tokens in localStorage** | Three cookies only (session, device, guest), all `httpOnly`, `SameSite=Lax`, `Secure` in production. Zero `localStorage` usage. |
| **2FA for admins** | RFC 6238 TOTP (`lib/totp.ts`), ±1 step. Setup resets `totp_confirmed`; it only counts as on after a valid code. New admin devices require device code **then** TOTP. |
| **Webhook signatures** | HMAC-SHA256 over `${timestamp}.${rawBody}` verified before JSON parsing, constant-time compare, 5-minute replay window, plus `INSERT OR IGNORE` event-id dedupe. |
| **Upload limits and private storage** | PNG/JPEG/WebP by magic bytes (no SVG), 2 MB, written `0600` outside `public/` with a random 32-hex name, served only through an ownership-checked route with `private, no-store`. |
| **CORS locked to our domain** | `Access-Control-Allow-Origin` is `APP_ORIGIN` only, `Vary: Origin`. Mutations also require `x-promptly-csrf: 1` and a matching `Origin`, verified server-side. |
| **No stack traces** | `handler()` converts every failure to a safe message; unexpected errors become `500 internal_error` and are logged server-side only. `poweredByHeader` off, CSP and security headers set in `next.config.ts`. |

## Known limits

- **CSP** needs `'unsafe-inline'` for scripts because Next injects inline bootstrap code; `'unsafe-eval'` is development-only.
- **Signup reveals existing emails** with `409 email_taken`. Login does not leak anything.
- **Uploads** are on local disk: private and ownership-checked, but not replicated across instances.
- **No password reset**, so recovery is manual until email is wired up.
- The pinned Next.js 15.5.4 has a published advisory (CVE-2025-66478); upgrade when the project can take a framework bump.
