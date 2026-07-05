# Tattvashila Core

Constitution-First Institutional Operating System — Backend

## Project Overview

Tattvashila Core is the production backend of the Tattvashila Ecosystem. It implements constitutional principles through software while preserving institutional integrity, modularity, and long-term maintainability.

The backend serves as the constitutional execution layer and is decoupled from any specific frontend.

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (Sprint 2+)
- **ORM**: Drizzle ORM (Sprint 2+)
- **API Style**: REST (Sprint 2+)
- **Authentication**: Stateful Sessions (Sprint 2+)
- **Testing**: Vitest

## Repository Structure

```
config/           # Application configuration (environment schema)
src/
  foundation/     # Runtime foundation — env, logger, registry, bootloader
  modules/        # Constitutional business modules (Sprint 2+)
tests/            # Test suites
```

## How to Run

```bash
npm start         # Run the application
npm run dev       # Run with --watch (auto-restart on file changes)
npm run typecheck # TypeScript type check only
npm run test      # Run test suite
npm run build     # Compile to dist/
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

| Variable    | Default       | Description                                     |
|-------------|---------------|-------------------------------------------------|
| `NODE_ENV`  | `development` | Environment: `development`, `production`, `test` |
| `LOG_LEVEL` | `info`        | Minimum log level: `debug`, `info`, `warn`, `error` |

## Architecture Rules

- Foundation (`src/foundation/`) must remain ignorant of all business modules.
- Business modules (`src/modules/`) register themselves via the Module Registry — Foundation never imports them.
- Cross-module communication occurs only through approved interfaces.
- Every module owns its own domain; modules never access each other's internals.

## Sprint Status

- **Sprint 1** ✅ — Foundation Layer (env config, logger, module registry, bootloader)
- **Sprint 2** — TRK (Constitutional Identity Foundation)
- **Sprint 3** — Tattvaloka (Constitutional Participation Layer)
- **Sprint 4** — Tattvapeetha (Constitutional Growth Layer)
- **Sprint 5** — Raksha Basic (Women's Safety Foundation)

## User Preferences

- Do not redesign the architecture.
- Do not suggest alternative frameworks unless the current design cannot be implemented.
- No speculative future-proofing.
- Implement only the currently approved sprint.
- No placeholder code, no TODOs, no dead code.
- Production-quality code only.
