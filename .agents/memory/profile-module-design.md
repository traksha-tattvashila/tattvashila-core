---
name: Profile module design
description: Constitutional identity profile foundation — schema, error handling, and wiring pattern for Sprint 11.
---

## Rule
Profile is a separate module (`src/modules/profile/`) that extends a constitutional identity. It never creates or modifies an identity. FK to `identities.id` is ON DELETE RESTRICT — deleting the identity while a profile references it is blocked. Deleting the profile never touches the identity.

## Key decisions

- `identity_profiles.identity_id` UNIQUE ensures 1:1 profile-per-identity at the DB level. The repository catches the unique violation and throws `ProfileError(ALREADY_EXISTS)` (intra-module error import — same module, acceptable).
- No application-layer find-before-insert check for duplicate profiles: DB constraint is the authoritative enforcement mechanism.
- `updateProfile` in the repository builds a dynamic `set()` payload — only fields that are not `undefined` are written. `undefined` = "leave unchanged"; `null` = "set to NULL".
- `UpdateProfileSchema` uses Zod `.refine()` to require at least one field in PATCH body, so the service and repository can never receive empty update objects.
- Profile router follows the same pattern as authorization router: receives `requireAuth: RequestHandler` as a parameter (no auth module internal imports). `http/routes/index.ts` constructs `createAuthMiddleware(deps.authService)` and passes it in.
- `ProfileErrorCode` prefix: `PROFILE_`. Codes: `PROFILE_NOT_FOUND` (404), `PROFILE_ALREADY_EXISTS` (409).
- `httpStatusForProfileCode` added to `error-handler.ts` with exhaustiveness guard; `isProfileError` checked before `isAppError`.

**Why:** The profile layer must remain constitutionally separate from identity. Any coupling — shared tables, shared error types, identity creation in profile operations — would violate the constitutional rule that the UUID is the identity and the profile is merely associated data.
