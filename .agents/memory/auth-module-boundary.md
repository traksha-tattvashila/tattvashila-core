---
name: Auth module boundary design
description: Why the auth module (Sprint 9) has no DB-level FK to identities and how it authenticates without touching identity_state.
---

The auth module (`src/modules/auth/`) stores `auth_credentials` and `refresh_tokens` with a plain `identity_id` uuid column — no foreign key to the `identities` table.

**Why:** cross-module boundary rule — modules never share DB-level internals. Identity existence is enforced at the service layer via `IdentityService.getById` / `getByVerifiedContact`, the approved cross-module interface, not via a DB constraint.

**How to apply:** any future module that needs to reference an identity should follow the same pattern — application-layer existence check through `IdentityService`, not a schema FK — unless a future sprint explicitly approves changing this rule.

Other durable decisions from Sprint 9:
- Login collapses all failure reasons (unknown contact, no credential, wrong password) into one `AUTH_INVALID_CREDENTIALS` error to avoid account enumeration.
- Refresh tokens are opaque random values; only their SHA-256 hash is persisted, and refresh always rotates (revoke old + issue new pair) — a replayed old token becomes detectable/invalid.
- JWT access tokens carry only `sub` (identity id) — no roles/permissions, since authorization is out of scope until a later sprint.
