---
name: Authorization Foundation (Sprint 10)
description: Design decisions for the authorization module — permission model, middleware chain, and cross-module dependency rules.
---

The authorization module lives at `src/modules/authorization/`. It depends on:
- `auth` module (routes.ts imports `createAuthMiddleware` + `AuthService` — one-way dependency)
- `trk` module (schema.ts imports `identities` for FK — same one-way direction)

No other module imports from authorization. auth/trk/verification are unaware of it.

**Permission model:** A permission is a `(resource, action)` pair stored in the `permissions` table with a UNIQUE constraint. The canonical string form is `resource:action` (e.g. `identities:read`). `ResolvedPermissions.permissions` is a `ReadonlySet<string>` of these keys for O(1) lookup in the pure engine.

**Middleware chain order:** `requireAuth` (Sprint 9) → `createResolvePermissionsMiddleware` → `requirePermission(resource, action)`. The resolve step is a DB round-trip (loads roles → permissions). `requirePermission` is synchronous — it reads from the already-attached `resolvedPermissions`.

**Why:** Separation keeps auth (who are you?) and authz (what can you do?) as distinct middleware steps. `requirePermission` can be composed after a single `resolvePermissions` call without repeating DB work.

**How to apply:** Future sprints define their roles/permissions by calling `authorizationService.grantPermissionToRole(roleName, resource, action)` at startup or seeding. They protect routes using the exported `createResolvePermissionsMiddleware` and `requirePermission` from `authorization/http/middleware.js`.

**identity_roles.identity_id** has a FK to `identities.id` ON DELETE RESTRICT — same integrity pattern established in Sprint 9 review.
