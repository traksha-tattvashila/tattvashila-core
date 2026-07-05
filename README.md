Tattvashila Core

«Constitution-First Institutional Operating System»

---

Purpose

Tattvashila Core is the production backend of the Tattvashila Ecosystem.

It is responsible for implementing the Constitution through software while preserving institutional integrity, modularity, and long-term maintainability.

The backend is not tied to any specific frontend application.

It exists as the constitutional execution layer that can serve multiple present and future clients.

---

Version 1 Scope

Version 1 is intentionally limited.

Only the following constitutional modules are within scope:

- TRK — Constitutional Identity Foundation
- Tattvaloka — Constitutional Participation Layer
- Tattvapeetha — Constitutional Growth Layer
- Raksha (Basic) — Women's Safety Foundation

All other constitutional modules remain outside the implementation scope until explicitly approved.

---

Architectural Philosophy

The system follows a Constitution-first architecture.

Constitution
        │
        ▼
Foundation
        │
        ▼
TRK
        │
        ▼
Tattvaloka
        │
        ▼
Tattvapeetha
        │
        ▼
Raksha

The Constitution is the highest authority.

Software exists only to faithfully implement constitutional principles.

---

Engineering Principles

- Constitution before software.
- Simplicity before cleverness.
- Longevity before convenience.
- Explicitness before hidden behaviour.
- Modularity before coupling.
- Security before optimization.

---

Repository Responsibilities

This repository is responsible for:

- Business logic
- Constitutional rule enforcement
- Identity lifecycle
- Database
- Authentication & sessions
- Authorization
- APIs
- Background jobs
- Infrastructure

This repository is NOT responsible for:

- UI
- Themes
- Animations
- Frontend routing
- Screen layouts
- Client rendering

---

Technology Stack (Version 1)

- Runtime: Node.js (LTS)
- Language: TypeScript (Strict Mode)
- Database: PostgreSQL
- ORM: Drizzle ORM
- API Style: REST
- Authentication: Stateful Sessions
- Testing: Vitest + Supertest

---

Module Boundaries

Every module owns its own domain.

Modules never access each other's internals directly.

Cross-module communication must occur through approved interfaces.

Foundation knows nothing about business modules.

Business modules never modify Foundation behaviour.

---

Repository Structure

config/
docs/
src/
foundation/
modules/
tests/

Detailed module structures will evolve during implementation.

---

Development Workflow

Every implementation follows the same sequence.

1. Review Constitution
2. Review ADRs
3. Review current sprint
4. Implement
5. Test
6. Review
7. Merge

No implementation proceeds without constitutional alignment.

---

AI Development Rules

Any AI assisting this repository must follow these rules:

- Never invent constitutional doctrine.
- Never redesign architecture without approval.
- Never introduce unnecessary dependencies.
- Never duplicate existing implementations.
- Never bypass module boundaries.
- Stop and request clarification whenever constitutional ambiguity exists.

---

Long-Term Goal

The objective is not merely to build software.

The objective is to build an institutional operating system that remains understandable, maintainable, and trustworthy across generations.

Every architectural decision should be evaluated with decades—not months—in mind.
