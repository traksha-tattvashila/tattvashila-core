---
name: Sprint freeze boundaries
description: Which sprints are constitutionally frozen and the rules governing amendments.
---

Sprint 1 (Foundation), Sprint 2 (Infrastructure), Sprint 3 (Constitutional Identity Schema),
Sprint 4A (Verification Infrastructure), Sprint 4B (Verification Engine), Sprint 5
(Verification API + TMP Issuance), Sprint 11 (Constitutional Identity Profile Foundation),
Sprint 12 (Public Constitutional Identifier System), Sprint 13 (Constitutional Identity
Discovery Layer), Sprint 14 (Constitutional Institution Identity Foundation), Sprint 15
(Constitutional Tattvaloka Foundation), and Sprint 16 (Tattvaloka Membership Foundation)
are all constitutionally frozen.

**Rule:** No sprint may be modified unless a genuine implementation bug is discovered OR an
explicit constitutional amendment is approved by the user.

**Sprint 3 schema freeze note:** The `processing_state` column on `identity_operational_metadata`
is intentionally TEXT (not enum) — operational states are not constitutionally finalized.
The `identity_state` enum (`TMP`, `TRK`) and `contact_type` enum (`phone`, `email`) are frozen.

**Sprint 4A contract freeze note:** `VerificationCache.update()` returning `boolean` is a
stable contract. `VerificationInfrastructure` must remain independent of the bootloader
until concrete outbound messaging providers are introduced.

**Why:** Constitutional architecture — every structural decision requires explicit approval;
accidental drift breaks identity continuity guarantees.

**How to apply:** Before modifying any existing file, check which sprint it belongs to.
If frozen, only proceed if a bug is confirmed or an amendment is received.
