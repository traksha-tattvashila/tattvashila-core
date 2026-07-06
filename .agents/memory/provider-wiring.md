---
name: Provider wiring rules
description: How SMS/email providers are resolved and the production fail-fast gate.
---

**Dev providers** (`createDevSmsProvider`, `createDevEmailProvider`) log OTPs to stdout.
They live in `src/infrastructure/verification/providers/dev-*-provider.ts`.
They must never run in production — they would expose live OTPs in logs.

**Gate location:** `resolveProviders()` in `src/index.ts`. If `env.nodeEnv === 'production'`,
the process calls `process.exit(1)` immediately with an actionable error message before any
provider is instantiated.

**Why:** Failing fast at startup in production is safer than silently degrading or logging
secrets. The guard uses `env.nodeEnv` (validated enum from `config/env.ts`), not raw
`process.env` access.

**How to apply:** When real SMS/email providers are implemented (future sprint), inject them
inside the `else` branch of `resolveProviders()` and remove the production exit guard.
The production providers must never log message bodies or OTP values.

**Future work:** `sessionStore` and `RecordLock` are also process-local (in-memory Map).
Scale-out requires shared backing (Redis, DB) for both — treat as a paired concern with
provider productionization.
