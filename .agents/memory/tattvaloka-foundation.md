---
name: Tattvaloka foundation design
description: Design boundary for the Tattvaloka (Constitutional Participation Layer) module introduced in its foundation sprint.
---

Tattvaloka is an application layer, never a constitutional identity — it has no
identity_state, no public identifier, and no TMP/TRK/INS-style lifecycle. It
follows the same 1:1-with-identity pattern as the profile module: a single
participant record per identity, unique constraint + `ON DELETE RESTRICT` FK
to `identities.id`, unique-violation mapped to an ALREADY_EXISTS domain error
in the service layer (never the repository).

**Why:** the roadmap explicitly scopes Tattvaloka's foundation sprint to
registration/lookup only — courses, lessons, progress, certificates,
payments, enrollment, AI features, notifications, and audit logging are
future, separately-approved sprints, not part of this foundation.

**How to apply:** when extending Tattvaloka, keep new tables/fields scoped to
participation state itself. Anything resembling course content, enrollment,
or engagement tracking is a new constitutional decision requiring explicit
sprint approval, not an extension of the existing participant record.

**Membership sub-layer (Sprint 16):** membership is a distinct 1:1-with-identity
record from participation, gated on participation already existing (service
calls the participation service's getParticipant and lets its NOT_FOUND
propagate — service-to-service dependency, never repository-to-repository).

**Drizzle schema-discovery gotcha:** `drizzle.config.ts` globs only files
literally named `schema.ts` (`./src/**/schema.ts`). New tables in a module
with multiple domain concepts (e.g. tattvaloka's participants + memberships)
must all live in that module's single `schema.ts`, not a `<feature>-schema.ts`
sibling, or `db:generate` silently skips them with "No schema changes".
