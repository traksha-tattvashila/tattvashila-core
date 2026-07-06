---
name: Provider wiring rules
description: How SMS/email providers are resolved between dev and production, and where config/health-check live.
---

**Dev providers** (`createDevSmsProvider`, `createDevEmailProvider`) log OTPs to stdout.
They live in `src/infrastructure/verification/providers/dev-*-provider.ts`.
They must never run in production — they would expose live OTPs in logs.

**Production providers:** Twilio (SMS, via raw `fetch` to the REST API — no SDK dependency)
and SMTP (email, via `nodemailer`, vendor-agnostic so any SMTP-compatible service works).
Live in `twilio-sms-provider.ts` / `smtp-email-provider.ts`. Both also implement the optional
`HealthCheckable` interface (`health.ts`) so credentials/connectivity are verified at startup
before the HTTP server starts listening — startup fails fast on bad config instead of failing
on the first real send.

**Resolution point:** `provider-factory.ts` picks dev vs production providers based on
`env.nodeEnv`. `src/index.ts` just calls the factory and awaits `validateProviderHealth`; it no
longer contains an inline provider-selection function.

**Why:** Provider secrets (Twilio/SMTP) are only required in production, so their env parsing
(`provider-config.ts`) is intentionally kept separate from the eagerly-built `config/env.ts`
`Env` object — dev/test must not need those secrets to boot.

**How to apply:** Any new provider channel should follow the same three-piece split: a config
loader (fail-fast env parsing), a concrete provider implementing the existing interface +
optionally `HealthCheckable`, and a branch in `provider-factory.ts`.

**Future work:** `sessionStore` and `RecordLock` are also process-local (in-memory Map).
Scale-out requires shared backing (Redis, DB) for both — treat as a paired concern with
provider productionization.
