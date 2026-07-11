# Constitutional Backend Roadmap

## Traksha Core — Remaining Backend Development

**Version:** v1.1 (Amendment A applied — see Amendment Log at end of document)

**Status of this document:** This roadmap defines every remaining backend sprint for the Traksha Core, starting immediately after Sprint 14. Sprints 1–14 are constitutionally frozen and are not redefined, redesigned, or modified anywhere in this document. All future sprints build strictly on top of the frozen foundation.

This document does not contain application code, database schemas, or API endpoints. It defines architectural scope, boundaries, and constitutional rules only.

---

## Table of Contents

**Part A0 — Shared Infrastructure**
- Sprint 15: Shared Event History & Audit Foundation

**Part A — Tattvaloka (Remaining Phases)**
- Sprint 16: Tattvaloka — Membership & Enrollment
- Sprint 17: Tattvaloka — Content Architecture
- Sprint 18: Tattvaloka — Progress & Completion Tracking
- Sprint 19: Tattvaloka — Discovery & Search

**Part B — Tattvapeetha**
- Sprint 20: Tattvapeetha — Constitutional Foundation
- Sprint 21: Tattvapeetha — Membership & Roles
- Sprint 22: Tattvapeetha — Program & Content Architecture
- Sprint 23: Tattvapeetha — Progress & Standing Tracking
- Sprint 24: Tattvapeetha — Discovery & Search

**Part C — Raksha**
- Sprint 25: Raksha — Constitutional Foundation
- Sprint 26: Raksha — Case & Report Management
- Sprint 27: Raksha — Resolution & Action Tracking
- Sprint 28: Raksha — Cross-Module Discovery

**Part D — Ecosystem Closure**
- Sprint 29: Cross-Ecosystem Integration Layer
- Sprint 30: Final Constitutional Freeze & Backend Completion Audit

---

## Constitutional Baseline (Reference Only — Frozen, Not Redefined Here)

The following are inherited as immutable constraints for every sprint in this document. They are restated here only for reference; their definitions live in Sprints 1–14 and are not altered.

- **UUID** — permanent internal constitutional identifier, never exposed publicly.
- **TMP** — `TMP-XXXXXXXXXXXXXXXX`, 16 uppercase alphanumeric characters, individual public identity.
- **TRK** — `TRK-XXXXXXXXXXXXXXXX`, 16 uppercase alphanumeric characters, generated independently of TMP.
- **INS** — `INS-XXXXXXXXXXXX`, 12 uppercase alphanumeric characters, institution public identity.
- Archived identifiers (TMP/TRK/INS) are never reissued.
- UUID continuity is the only constitutional continuity — public identifiers are cosmetic-permanent, not structurally load-bearing.
- Authentication, Authorization, Constitutional Profile, Institution Identity Foundation, Public Identifier Discovery, and Constitutional Tattvaloka Foundation are complete and must be reused, never rebuilt.

Every sprint below must reuse these primitives. No sprint may introduce a competing identity, numbering scheme, or discovery mechanism.

---

# PART A0 — SHARED INFRASTRUCTURE

Amendment A (see Amendment Log) inserts this sprint ahead of all module-level membership/role/discovery work. Its purpose is to remove a specific inconsistency identified in roadmap review: multiple later sprints referenced an "audit trail" as if it were a generic, ecosystem-wide capability, while earlier sprints explicitly excluded generic audit logging from scope. This sprint resolves that by giving the ecosystem exactly one constitutional event-history mechanism, which every module reuses rather than reinvents.

---

## Sprint 15: Shared Event History & Audit Foundation

### Objective
Define a single, reusable, constitutional event-history mechanism that any module may attach to any state-transitioning record, so that "audit trail" is never again implemented as a bespoke, per-module concept.

### Problem Being Solved
Without this sprint, terms like "audit trail" appear in module-level sprints (e.g., membership transitions, role changes, discovery queries) with no common definition, ownership, or storage model. Each module would be free to invent its own notion of history-keeping, producing inconsistent guarantees, inconsistent query patterns, and duplicated architectural effort. This was flagged explicitly in roadmap review as an inconsistency requiring resolution before implementation.

### Why This Sprint Exists
Event history is a cross-cutting concern, structurally similar to identity (TMP/TRK/INS/UUID) in that every module needs it but no single module should own or reinvent it. Exactly as identity got one frozen foundation reused everywhere, event history now gets one frozen foundation reused everywhere.

### Scope
- Define the constitutional Event Record: a single, generic, append-only structure capable of representing "some constitutional entity transitioned from state A to state B, performed by actor X, at time T, within module M."
- Define the Event Record as domain-agnostic: it stores *what happened*, referencing subject and actor by public identifier (TMP/TRK/INS) or by the constitutional entity's own identifier, never by embedding module-specific business logic.
- Define the append-only guarantee as an ecosystem-wide constitutional rule: no Event Record, once written, may ever be edited or deleted by any module.
- Define how a module registers a new event *type* against this shared foundation (e.g., "membership.activated," "role.granted," "case.discovery_queried") without modifying the foundation itself.
- Define query boundaries at the foundation level: who may read event history for a given subject, deferring fine-grained authorization scoping to the consuming module (e.g., Raksha's stricter confidentiality rules from its own foundation sprint still apply on top of this).

### Reuse Requirements
- Must reuse UUID as the internal continuity key for the subject and actor of every event.
- Must reuse TMP/TRK/INS as the public-facing reference fields where an event needs to be human/audit-referenceable.
- This sprint's output must be reused by every subsequent sprint in this roadmap that previously used the term "audit trail," specifically Sprint 16 (Tattvaloka Membership), Sprint 21 (Tattvapeetha Membership & Roles), and Sprint 28 (Raksha Cross-Module Discovery).

### Constitutional Rules
- There is exactly one Event Record structure in the entire ecosystem. No module may define a second, competing history mechanism.
- Event Records are immutable and append-only without exception.
- Event *types* are extensible by any module without requiring modification of this foundation sprint's frozen structure — this is the mechanism by which future sprints "plug into" event history without reopening this sprint.
- The foundation defines the *storage and structural* contract for events; it does not define *who may read* a given module's events beyond a baseline actor/subject visibility rule — each module's own constitutional rules (e.g., Raksha's stricter confidentiality) govern read access on top of this baseline.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No module-specific business logic (no membership rules, no role rules, no case rules) — this sprint is purely the shared structural mechanism.
- No analytics, reporting dashboards, or trend detection over event history.
- No mutation or deletion pathway of any kind, not even for administrative correction — corrections must be new, additional events, never edits.
- No new identifier format; events reference existing UUID/TMP/TRK/INS only.

### Expected Deliverables
- Constitutional Event Record structure specification.
- Event-type registration mechanism (how modules declare new event types without modifying this foundation).
- Baseline read-access rule (actor/subject visibility), explicitly layered beneath each module's own stricter rules where applicable.

### Engineering Review Checklist
- [ ] Is there exactly one Event Record structure defined, with no module-specific variants?
- [ ] Is the append-only, no-edit-no-delete guarantee unconditional?
- [ ] Can new event types be registered without modifying this sprint's frozen structure?
- [ ] Does the baseline read-access rule explicitly defer to stricter module-level rules rather than overriding them?

### Dependencies on Previous Sprints
- Requires: UUID, TMP, TRK, INS (frozen), Authorization (frozen).

### What Becomes Frozen After Approval
- The Event Record structure.
- The append-only constitutional guarantee.
- The event-type registration mechanism.
- The term **"audit trail"** is retired from this roadmap's vocabulary from this point forward; all subsequent sprints use **"event history"** to refer exclusively to this shared mechanism, never a module-local reinvention.

---

# PART A — TATTVALOKA (REMAINING PHASES)

The Constitutional Tattvaloka Foundation (Sprint ≤14) already established Tattvaloka's core constitutional entity, its relationship to TMP/TRK identities, and its baseline data model anchor. The following sprints build the operational layers on top of that frozen foundation.

---

## Sprint 16: Tattvaloka — Membership & Enrollment

### Objective
Establish how constitutional identities (TMP-holders) become members of, or enroll into, Tattvaloka learning structures, and how that membership state is tracked over time.

### Problem Being Solved
The foundation sprint defined *what Tattvaloka is* constitutionally. It did not define *who participates in it* or *how participation is recorded*. Without this sprint, there is no way to associate a TMP identity with a specific Tattvaloka learning context in a durable, referenceable way.

### Why This Sprint Exists
Membership is a distinct architectural responsibility from identity (already frozen) and from content (not yet built). Conflating membership with content or with identity would violate the single-responsibility principle mandated for this roadmap.

### Scope
- Define the constitutional membership record linking a TMP UUID to a Tattvaloka context.
- Define membership states (e.g., active, dormant, withdrawn, archived) as a closed constitutional enumeration.
- Define enrollment initiation, acceptance, and withdrawal as constitutional state transitions.
- Every membership state transition must emit an Event Record via the Shared Event History Foundation (Sprint 15) — no module-local history mechanism may be built here.

### Reuse Requirements
- Must reuse the existing TMP identity resolution mechanism from Sprints 1–14.
- Must reuse the existing UUID as the sole internal join key — never join on TMP string directly.
- Must reuse the Constitutional Tattvaloka Foundation's entity anchor as the parent of all membership records.
- Must reuse the Shared Event History Foundation (Sprint 15) for all membership transition history; must not implement a bespoke audit log.

### Constitutional Rules
- A membership record must never be deleted; only state-transitioned to an archived state.
- A single TMP identity may hold at most one active membership record per distinct Tattvaloka context, but may hold historical (archived) records without limit.
- Every membership state transition is recorded exclusively through the Sprint 15 Event Record mechanism.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No content, lessons, or curriculum structures (Sprint 17).
- No progress or completion percentage tracking (Sprint 18).
- No search or discovery of members (Sprint 19).
- No redefinition of TMP generation or format.
- No module-local history/audit table of any kind — this is now exclusively Sprint 15's responsibility.
- No payment or billing logic.

### Expected Deliverables
- Membership state model (enumeration + transition rules), described architecturally.
- Enrollment/withdrawal transition rules.
- Confirmation that every transition maps to a Sprint 15 Event Record, with the specific event types this module registers (e.g., `tattvaloka.membership.enrolled`, `tattvaloka.membership.withdrawn`).

### Engineering Review Checklist
- [ ] Does every membership record resolve back to exactly one UUID?
- [ ] Is the membership state enumeration closed and exhaustive?
- [ ] Does every state transition emit a Sprint 15 Event Record rather than a local history mechanism?
- [ ] Does the design avoid any reference to content or progress?

### Dependencies on Previous Sprints
- Requires: TMP Identity, Constitutional Tattvaloka Foundation, Authorization, Sprint 15 (Shared Event History Foundation).

### What Becomes Frozen After Approval
- Membership state enumeration.
- Enrollment/withdrawal transition rules.
- Membership-to-identity join architecture (UUID-based).
- The registered Tattvaloka membership event types.

---

## Sprint 17: Tattvaloka — Content Architecture

### Objective
Define the constitutional structure for Tattvaloka's learning content — how it is organized, versioned, and referenced — independent of who consumes it or how far they've progressed.

### Problem Being Solved
Without a frozen content architecture, future content additions risk ad hoc, inconsistent structures that cannot be reliably tracked for progress or discovered through search.

### Why This Sprint Exists
Content is a distinct architectural responsibility from membership (who) and progress (how far). This sprint defines the *what* — the shape of the material itself.

### Scope
- Define the hierarchical content unit model (e.g., top-level path → module → unit, naming left to implementation but hierarchy depth must be fixed constitutionally).
- Define content versioning rules — how a content unit may be revised without breaking historical progress references.
- Define immutable content identifiers distinct from UUID (content units are not constitutional identities and must not reuse the TMP/TRK/INS identifier standard).
- Define content status states (draft, published, retired) as a closed enumeration.

### Reuse Requirements
- Must anchor all content units to the Constitutional Tattvaloka Foundation entity.
- Must not introduce a new identity format resembling TMP/TRK/INS — content identifiers are structurally and semantically distinct from constitutional public identifiers.

### Constitutional Rules
- Published content units are immutable in substance; revisions create new versions, never in-place mutation of published material.
- Retired content units must remain permanently resolvable for historical progress integrity, even if no longer enrollable.
- Content hierarchy depth, once frozen, must not be restructured in later sprints without a new constitutional amendment sprint.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No membership or enrollment logic (Sprint 16, already defined).
- No progress percentage or completion logic (Sprint 18).
- No search indexing or discovery logic (Sprint 19).
- No frontend rendering concerns of any kind.

### Expected Deliverables
- Content hierarchy specification.
- Versioning and immutability rules.
- Content status enumeration and transition rules.

### Engineering Review Checklist
- [ ] Is content hierarchy depth fixed and documented?
- [ ] Are published units guaranteed immutable in substance?
- [ ] Is versioning handled by new-version-creation rather than mutation?
- [ ] Does the design avoid inventing a new public identifier format?

### Dependencies on Previous Sprints
- Requires: Constitutional Tattvaloka Foundation.
- Independent of Sprint 16 (membership) — may be developed in parallel.

### What Becomes Frozen After Approval
- Content hierarchy depth and structure.
- Versioning and immutability rules.
- Content status enumeration.

---

## Sprint 18: Tattvaloka — Progress & Completion Tracking

### Objective
Define how a member's advancement through content is recorded, computed, and preserved over time.

### Problem Being Solved
Membership (Sprint 16) tells us who is enrolled. Content (Sprint 17) tells us what exists. Neither tells us how far a given member has progressed through that content. Without this sprint, there is no durable, reliable record of learning advancement.

### Why This Sprint Exists
Progress tracking is a distinct responsibility that depends on both membership and content but must not be merged into either, since progress data changes at a different rate and for different reasons than membership state or content structure.

### Scope
- Define the progress record linking a membership record to specific content unit versions.
- Define completion state per content unit (not-started, in-progress, completed).
- Define aggregate progress computation rules (how unit-level completion rolls up to context-level progress).
- Define how progress records behave when referenced content is retired or revised.

### Reuse Requirements
- Must reuse the membership record from Sprint 16 as the anchor for all progress data — never link progress directly to TMP.
- Must reuse the immutable content version identifiers from Sprint 17.

### Constitutional Rules
- Progress records must reference specific content *versions*, not mutable content units, to preserve historical accuracy.
- Aggregate progress must be computable, never stored as a mutable cached truth without a defined recomputation rule.
- A progress record must survive the retirement of its referenced content version.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No changes to membership state model (frozen in Sprint 16).
- No changes to content hierarchy (frozen in Sprint 17).
- No search or discovery mechanisms (Sprint 19).
- No gamification, scoring, or certification logic unless constitutionally defined elsewhere.

### Expected Deliverables
- Progress record architecture.
- Completion state enumeration.
- Aggregate progress computation rules.
- Rules for progress record survival under content retirement/revision.

### Engineering Review Checklist
- [ ] Does every progress record reference a membership record, not a raw TMP?
- [ ] Does every progress record reference an immutable content version?
- [ ] Is aggregate progress computed rather than blindly cached?
- [ ] Does the design handle content retirement without data loss?

### Dependencies on Previous Sprints
- Requires: Sprint 16 (Membership), Sprint 17 (Content Architecture).

### What Becomes Frozen After Approval
- Progress record architecture.
- Completion state enumeration.
- Aggregate computation rules.

---

## Sprint 19: Tattvaloka — Discovery & Search

### Objective
Define how Tattvaloka content and public-facing membership information can be discovered and searched, without altering any of the underlying constitutional data it reads from.

### Problem Being Solved
Members and institutions need to find relevant content and public learning context. Without a dedicated discovery layer, search logic would otherwise leak into membership, content, or progress sprints, violating single-responsibility architecture.

### Why This Sprint Exists
Discovery is a read-oriented architectural concern that must be strictly separated from the write-oriented, state-owning sprints above it. This sprint deliberately does not commit to a specific search technology (e.g., a relational query layer vs. Elasticsearch/OpenSearch) — the constitutional contract is the read-only, derived nature of the layer, not its implementation engine.

### Scope
- Define the discovery/search index architecture as a read-only derived layer over content and membership data.
- Define what fields are searchable and what remains constitutionally private (e.g., no raw UUIDs ever surface in search results).
- Define re-indexing triggers tied to content publication and retirement events from Sprint 17.
- Define query boundaries — what discovery may and may not expose about a member's progress.

### Reuse Requirements
- Must reuse the Public Identifier Discovery mechanism from Sprints 1–14 as the base pattern for any public-facing lookup.
- Must treat content and membership sprints as source-of-truth; discovery holds no primary data.

### Constitutional Rules
- The discovery layer is strictly derived and read-only; it must never be treated as a system of record.
- Discovery must never expose UUIDs; only TMP/TRK/INS and content version identifiers may surface.
- Search must never expose granular per-member progress data to any party other than the member and constitutionally authorized institution roles.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No mutation of membership, content, or progress data from within discovery.
- No new identity or content structures.
- No frontend search UI concerns.
- No analytics, ranking algorithms, or recommendation engines beyond basic constitutional query matching.
- No commitment to a specific search technology or engine — that is an implementation detail outside this roadmap's scope.

### Expected Deliverables
- Discovery/search index architecture (as a derived, read-only layer).
- Field-level exposure rules (public vs. private).
- Re-indexing trigger rules.

### Engineering Review Checklist
- [ ] Is the discovery layer strictly read-only and derived?
- [ ] Are UUIDs confirmed to never surface in any search result?
- [ ] Are progress data exposure rules explicitly bounded?
- [ ] Does re-indexing tie cleanly to content lifecycle events from Sprint 17?

### Dependencies on Previous Sprints
- Requires: Sprint 17 (Content Architecture), Sprint 16 (Membership), Public Identifier Discovery (frozen).

### What Becomes Frozen After Approval
- Discovery index architecture and its read-only nature.
- Field-level public/private exposure rules.
- Tattvaloka is now considered **feature-complete** at the backend architectural level.

---

# PART B — TATTVAPEETHA

Tattvapeetha is a distinct application module from Tattvaloka. It reuses the frozen Institution Identity Foundation (INS) rather than the individual TMP-centric Tattvaloka foundation, but follows the same phase pattern: Foundation → Membership → Content/Program → Progress → Discovery.

---

## Sprint 20: Tattvapeetha — Constitutional Foundation

### Objective
Establish the constitutional entity model for Tattvapeetha, anchored to the frozen Institution Identity Foundation, mirroring the discipline applied to Tattvaloka's own foundation sprint.

### Problem Being Solved
No constitutional anchor currently exists for Tattvapeetha as an application module. Without this sprint, no Tattvapeetha-specific data — membership, programs, or progress — has a valid root to attach to.

### Why This Sprint Exists
Every application module requires its own constitutional foundation sprint before any operational logic can be layered on top, exactly as Tattvaloka required its own foundation before membership/content/progress/discovery.

### Scope
- Define the Tattvapeetha constitutional entity and its relationship to INS (institution) and, where applicable, TMP (individual affiliate) identities.
- Define whether Tattvapeetha entities are institution-owned, individual-owned, or dual-owned, as a fixed constitutional rule.
- Define the entity's relationship to UUID as sole internal continuity key.

### Reuse Requirements
- Must reuse INS and Institution Identity Foundation without modification.
- Must reuse TMP identity resolution where individual affiliation applies.
- Must reuse the general constitutional entity pattern established for Tattvaloka's foundation, without copying Tattvaloka-specific fields.

### Constitutional Rules
- A Tattvapeetha entity must resolve to exactly one owning INS (and optionally affiliated TMPs), never the reverse ambiguity.
- The entity anchor, once frozen, is the permanent root for all subsequent Tattvapeetha sprints.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No membership logic (Sprint 21).
- No program/content logic (Sprint 22).
- No progress logic (Sprint 23).
- No discovery/search logic (Sprint 24).
- No modification of Institution Identity Foundation.

### Expected Deliverables
- Tattvapeetha constitutional entity specification.
- Ownership model (institution/individual/dual) as a fixed rule.

### Engineering Review Checklist
- [ ] Does the entity resolve to exactly one INS owner?
- [ ] Is UUID the sole internal continuity key?
- [ ] Is the Institution Identity Foundation left completely unmodified?

### Dependencies on Previous Sprints
- Requires: Institution Identity Foundation (frozen), TMP Identity (frozen).

### What Becomes Frozen After Approval
- Tattvapeetha constitutional entity model and ownership rules.

---

## Sprint 21: Tattvapeetha — Membership & Roles

### Objective
Define how individuals (TMP) and sub-institutions affiliate with a Tattvapeetha entity, including role-based standing within it.

### Problem Being Solved
Tattvapeetha's foundation defines the entity itself but not who belongs to it or in what capacity. Institutions typically require role differentiation (e.g., instructor, administrator, participant) that individual-learner Tattvaloka membership does not need — hence this is architecturally distinct from Sprint 16, not a copy of it.

### Why This Sprint Exists
Role-aware membership is a different problem from flat membership. Conflating the two would force Tattvaloka to carry unnecessary role complexity or force Tattvapeetha into an inadequate flat model.

### Scope
- Define the Tattvapeetha membership record linking TMP UUID to the Tattvapeetha entity from Sprint 20.
- Define a closed role enumeration appropriate to institutional structures.
- Define role assignment, change, and revocation as constitutional state transitions.
- Every role assignment, change, and revocation must emit an Event Record via the Shared Event History Foundation (Sprint 15) — no module-local history mechanism may be built here.

### Reuse Requirements
- Must reuse UUID as sole join key.
- Must reuse the Tattvapeetha entity anchor from Sprint 20.
- Must reuse the Shared Event History Foundation (Sprint 15) for all role-transition history; must not implement a bespoke audit log, and must not import Tattvaloka's specific membership schema.

### Constitutional Rules
- Role assignments must be independently traceable from membership existence itself (a member may exist without an active role during transitional states) — this traceability is provided exclusively through Sprint 15 Event Records.
- No individual may hold a role that was not explicitly and constitutionally granted.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No program/content structures (Sprint 22).
- No progress or standing computation (Sprint 23).
- No discovery/search (Sprint 24).
- No cross-reuse of Tattvaloka's membership tables or logic.
- No module-local history/audit table of any kind — this is now exclusively Sprint 15's responsibility.

### Expected Deliverables
- Tattvapeetha membership + role model.
- Role enumeration and transition rules.
- Confirmation that every role transition maps to a Sprint 15 Event Record, with the specific event types this module registers (e.g., `tattvapeetha.role.granted`, `tattvapeetha.role.revoked`).

### Engineering Review Checklist
- [ ] Is membership existence separable from role assignment?
- [ ] Is the role enumeration closed and exhaustive?
- [ ] Does every role transition emit a Sprint 15 Event Record rather than a local history mechanism?
- [ ] Does this avoid reusing Tattvaloka membership internals directly?

### Dependencies on Previous Sprints
- Requires: Sprint 20 (Tattvapeetha Foundation), Sprint 15 (Shared Event History Foundation).

### What Becomes Frozen After Approval
- Role enumeration.
- Membership/role transition rules.
- The registered Tattvapeetha role event types.

---

## Sprint 22: Tattvapeetha — Program & Content Architecture

### Objective
Define the structural model for institutional programs and their associated content within Tattvapeetha.

### Problem Being Solved
Tattvapeetha needs a way to represent structured institutional offerings (programs, courses, or equivalent) distinct from Tattvaloka's individual-learning content model, since ownership, authorship, and lifecycle rules differ at the institutional level.

### Why This Sprint Exists
Institutional content has different authorship and approval semantics than individual-learning content — it is architecturally justified as a separate phase rather than a reuse of Sprint 17.

### Scope
- Define the program hierarchy (e.g., program → track → unit) anchored to the Tattvapeetha entity.
- Define authorship and approval rules — which roles (from Sprint 21) may create, publish, or retire program content.
- Define immutable versioning rules for published program content, mirroring the immutability discipline of Sprint 17 without importing its schema.

### Reuse Requirements
- Must anchor to Sprint 20's Tattvapeetha entity.
- Must reuse Sprint 21's role enumeration to gate authorship/approval actions.
- Must apply the same immutability *principle* as Sprint 17 but as an independent structure.

### Constitutional Rules
- Only constitutionally authorized roles may transition program content between draft, published, and retired states.
- Published program content is immutable in substance; revision creates new versions.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No progress/standing tracking (Sprint 23).
- No discovery/search (Sprint 24).
- No direct reuse of Tattvaloka's content tables.
- No cross-institution content sharing logic (out of scope unless a future constitutional amendment sprint defines it).

### Expected Deliverables
- Program hierarchy specification.
- Authorship/approval role-gating rules.
- Versioning and immutability rules.

### Engineering Review Checklist
- [ ] Is program hierarchy depth fixed and documented?
- [ ] Are authorship/approval actions gated by Sprint 21 roles?
- [ ] Is published content immutable in substance?

### Dependencies on Previous Sprints
- Requires: Sprint 20 (Foundation), Sprint 21 (Membership & Roles).

### What Becomes Frozen After Approval
- Program hierarchy structure.
- Authorship/approval gating rules.
- Versioning rules.

---

## Sprint 23: Tattvapeetha — Progress & Standing Tracking

### Objective
Define how individual standing (e.g., completion, certification eligibility, or equivalent institutional progress concept) is tracked against Tattvapeetha programs.

### Problem Being Solved
Without this sprint, there is no durable link between a Tattvapeetha member's role/membership and their advancement through institutional program content.

### Why This Sprint Exists
Progress tracking at the institutional level has different rollup and authorization semantics (e.g., instructor-verified completion) than individual Tattvaloka progress, justifying a separate phase.

### Scope
- Define the standing record linking a Tattvapeetha membership record to specific program content versions.
- Define standing states (not-started, in-progress, completed, certified — as a closed enumeration appropriate to institutional context).
- Define which roles may attest or verify standing transitions.
- Define aggregate standing computation rules.

### Reuse Requirements
- Must reuse the membership record from Sprint 21 as anchor, never linking directly to raw TMP.
- Must reuse immutable program content versions from Sprint 22.

### Constitutional Rules
- Standing records must reference specific content versions, preserving historical accuracy under content revision.
- Certain standing transitions (e.g., "certified") may require attestation by a constitutionally authorized role; this gating rule must be explicit and closed.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No discovery/search (Sprint 24).
- No changes to membership/role model (frozen in Sprint 21).
- No changes to program hierarchy (frozen in Sprint 22).
- No external certification/credentialing integrations.

### Expected Deliverables
- Standing record architecture.
- Standing state enumeration and attestation-gating rules.
- Aggregate computation rules.

### Engineering Review Checklist
- [ ] Does every standing record reference a membership record, not raw TMP?
- [ ] Does every standing record reference an immutable program content version?
- [ ] Are attestation-gated transitions explicitly bounded by role?

### Dependencies on Previous Sprints
- Requires: Sprint 21 (Membership & Roles), Sprint 22 (Program & Content Architecture).

### What Becomes Frozen After Approval
- Standing record architecture.
- Standing state enumeration.
- Attestation-gating rules.

---

## Sprint 24: Tattvapeetha — Discovery & Search

### Objective
Define the read-only discovery layer for Tattvapeetha programs and public institutional standing information.

### Problem Being Solved
Institutions and individuals need to discover programs and verify public standing/certification without exposing internal constitutional data or granular progress records.

### Why This Sprint Exists
Mirrors Sprint 19's justification: discovery must remain a strictly derived, read-only concern, separate from every state-owning sprint above it.

### Scope
- Define the discovery/search index architecture over Sprint 22 program data and Sprint 20 entity data.
- Define publicly exposable standing information (e.g., certification status) versus private standing detail.
- Define re-indexing triggers tied to program publication/retirement and standing certification events.

### Reuse Requirements
- Must reuse the Public Identifier Discovery mechanism pattern from the frozen foundation.
- Must treat Sprints 20–23 as source-of-truth; discovery holds no primary data.

### Constitutional Rules
- The discovery layer is strictly derived and read-only.
- UUIDs must never surface; only INS, TMP, and program content version identifiers may appear.
- Only constitutionally designated public standing fields (e.g., certified/not-certified) may be exposed; granular standing history remains private to the member and authorized institution roles.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No mutation of entity, membership, program, or standing data from within discovery.
- No cross-institution ranking, comparison, or analytics.
- No frontend search UI concerns.

### Expected Deliverables
- Discovery/search index architecture.
- Public/private field exposure rules for standing data.
- Re-indexing trigger rules.

### Engineering Review Checklist
- [ ] Is the discovery layer strictly read-only and derived?
- [ ] Are UUIDs confirmed to never surface?
- [ ] Are public standing fields explicitly and minimally defined?

### Dependencies on Previous Sprints
- Requires: Sprint 20, Sprint 22, Sprint 23, Public Identifier Discovery (frozen).

### What Becomes Frozen After Approval
- Discovery index architecture and read-only nature.
- Public/private standing field exposure rules.
- Tattvapeetha is now considered **feature-complete** at the backend architectural level.

---

# PART C — RAKSHA

Raksha is the protection/integrity module of the ecosystem. Unlike Tattvaloka and Tattvapeetha, it is not a learning/membership module — it is a constitutional safeguarding module that references identities and entities across the ecosystem without owning their primary data. Its phases therefore differ in shape: Foundation → Case & Report Management → Resolution & Action Tracking → Cross-Module Discovery.

---

## Sprint 25: Raksha — Constitutional Foundation

### Objective
Establish the constitutional entity model for Raksha as an ecosystem-wide protection and integrity layer, defining how it references — without owning — TMP, TRK, INS, and application-module entities.

### Problem Being Solved
No constitutional anchor exists for reporting, safeguarding, or integrity concerns across the ecosystem. Without a clearly bounded foundation, protection logic risks being scattered across Tattvaloka and Tattvapeetha in an inconsistent, unauditable way.

### Why This Sprint Exists
Cross-cutting protection concerns must have a single, dedicated constitutional home rather than being duplicated per application module, and that home must be established before any case-handling logic (Sprint 26) can exist.

### Scope
- Define the Raksha constitutional entity as an ecosystem-level module, not owned by any single institution.
- Define its reference-only relationship to TMP, TRK, INS, and Tattvaloka/Tattvapeetha entities — Raksha may reference these by public identifier but must never become their system of record.
- Define the constitutional principle that Raksha records are protective/evidentiary and therefore held to stricter immutability and access-control standards than ordinary application data.

### Reuse Requirements
- Must reuse TMP, TRK, INS resolution mechanisms without modification.
- Must reuse UUID as sole internal continuity key for any Raksha-owned record.
- Must not duplicate or shadow-copy primary data from Tattvaloka or Tattvapeetha; reference only.

### Constitutional Rules
- Raksha never becomes the primary owner of identity, membership, content, or progress data — its role is strictly protective/evidentiary.
- Access to Raksha data must be governed by a stricter authorization tier than standard application data, defined here as a constitutional principle (mechanism deferred to Sprint 26/27 where relevant).

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No case/report record structures yet (Sprint 26).
- No resolution/action workflows (Sprint 27).
- No discovery/search (Sprint 28).
- No duplication of any Tattvaloka/Tattvapeetha primary data.

### Expected Deliverables
- Raksha constitutional entity specification.
- Reference-only relationship rules to existing identities/entities.
- Stricter access-control principle statement (architectural, not implementation).

### Engineering Review Checklist
- [ ] Is Raksha confirmed as reference-only with no primary data duplication?
- [ ] Is UUID the sole internal continuity key for Raksha-owned records?
- [ ] Is the stricter access-control principle explicitly documented?

### Dependencies on Previous Sprints
- Requires: TMP, TRK, INS identity systems (frozen), Tattvaloka and Tattvapeetha foundations.

### What Becomes Frozen After Approval
- Raksha constitutional entity model.
- Reference-only relationship principle.
- Stricter access-control principle.

---

## Sprint 26: Raksha — Case & Report Management

### Objective
Define how a report or concern is constitutionally recorded, referencing relevant identities/entities without duplicating their data.

### Problem Being Solved
The foundation sprint establishes that Raksha may reference other entities but does not yet define how a concern is actually captured, structured, or protected once reported.

### Why This Sprint Exists
Case/report intake is a distinct responsibility from resolution (Sprint 27) — a report must be reliably and immutably captured before any action is taken on it.

### Scope
- Define the case/report record structure: reporter reference, subject reference(s), category, and narrative content, all referencing existing identities by public identifier.
- Define a closed case-status enumeration limited to intake-level states (e.g., submitted, under-review) — resolution states belong to Sprint 27.
- Define immutability rules for the original report content (the initial submission must never be altered, only supplemented).
- Define confidentiality rules for reporter identity where constitutionally appropriate.

### Reuse Requirements
- Must reuse TMP/TRK/INS reference resolution from the Foundation sprint (Sprint 25).
- Must reuse UUID as the internal key for case records.

### Constitutional Rules
- The original report content is immutable once submitted; supplementary information is appended, never merged into or overwriting the original.
- Reporter identity confidentiality rules must be explicit and enforced at the architectural level, not left to implementation discretion.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No resolution or action-taking logic (Sprint 27).
- No discovery/search (Sprint 28).
- No automated categorization, scoring, or triage algorithms.
- No direct mutation of Tattvaloka/Tattvapeetha membership or standing data from within this sprint.

### Expected Deliverables
- Case/report record architecture.
- Intake-level status enumeration.
- Immutability and confidentiality rules.

### Engineering Review Checklist
- [ ] Is the original report content confirmed immutable?
- [ ] Are confidentiality rules for reporter identity explicit?
- [ ] Is the status enumeration limited strictly to intake-level states?

### Dependencies on Previous Sprints
- Requires: Sprint 25 (Raksha Foundation).

### What Becomes Frozen After Approval
- Case/report record architecture.
- Intake status enumeration.
- Immutability and confidentiality rules.

---

## Sprint 27: Raksha — Resolution & Action Tracking

### Objective
Define how a submitted case progresses to resolution, including what actions may be constitutionally recorded and by whom.

### Problem Being Solved
Sprint 26 captures a report reliably; it does not define how the ecosystem responds to it. Without this sprint, there is no reliable chain from report to outcome.

### Why This Sprint Exists
Resolution/action tracking is a distinct responsibility from intake — it involves different authorization requirements (only specific constitutionally designated roles may act) and different state semantics (outcomes, not submissions).

### Scope
- Define resolution-status enumeration as a continuation of, but distinct from, the intake-status enumeration in Sprint 26 (e.g., under-investigation, resolved, dismissed, escalated).
- Define which constitutionally designated roles may transition a case through resolution states.
- Define the action-log architecture: every action taken on a case, by whom, and when, is recorded exclusively through the Shared Event History Foundation (Sprint 15) — Raksha does not build its own history mechanism.
- Define how resolution outcomes may (or must not) reference back into Tattvaloka/Tattvapeetha membership or role data — as a reference only, never a direct mutation performed by Raksha itself.

### Reuse Requirements
- Must reuse the case/report record from Sprint 26 as the anchor for all resolution and action data.
- Must reuse role/authorization concepts established across the frozen foundation and application-module role sprints, adapted to a Raksha-specific authorized-actor enumeration.
- Must reuse the Shared Event History Foundation (Sprint 15) for the action log; must not implement a bespoke log.

### Constitutional Rules
- The action log is provided exclusively by Sprint 15 Event Records and is therefore unconditionally append-only, consistent with every other module's event history.
- Raksha may recommend or reference a downstream consequence (e.g., a membership or role review) but must never directly mutate Tattvaloka/Tattvapeetha data itself — any such change must occur through that module's own constitutional mechanisms, triggered by, but not executed by, Raksha.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No discovery/search (Sprint 28).
- No direct write access to Tattvaloka/Tattvapeetha membership, role, or standing records.
- No automated decision-making or algorithmic resolution.
- No re-opening of the immutable original report content from Sprint 26.
- No module-local history/audit table of any kind — this is now exclusively Sprint 15's responsibility.

### Expected Deliverables
- Resolution-status enumeration.
- Authorized-actor role enumeration for Raksha.
- Confirmation that every action maps to a Sprint 15 Event Record, with the specific event types this module registers (e.g., `raksha.case.investigation_started`, `raksha.case.resolved`).
- Cross-module reference (not mutation) rules.

### Engineering Review Checklist
- [ ] Does every action on a case emit a Sprint 15 Event Record rather than a local history mechanism?
- [ ] Is it architecturally impossible for Raksha to directly mutate Tattvaloka/Tattvapeetha data?
- [ ] Is the authorized-actor role enumeration closed and distinct from general application roles?

### Dependencies on Previous Sprints
- Requires: Sprint 26 (Case & Report Management), Sprint 25 (Raksha Foundation), Sprint 15 (Shared Event History Foundation).

### What Becomes Frozen After Approval
- Resolution-status enumeration.
- The registered Raksha action event types.
- Cross-module reference-only boundary rule.

---

## Sprint 28: Raksha — Cross-Module Discovery

### Objective
Define a strictly access-controlled, read-only discovery mechanism for authorized parties to query case existence and status, without exposing protected report content broadly.

### Problem Being Solved
Authorized reviewers and constitutionally designated roles need a way to find relevant cases (e.g., all cases referencing a given INS) without ad hoc, unaudited queries against sensitive report data.

### Why This Sprint Exists
Even protective/evidentiary data requires a discovery layer for legitimate authorized use — but given Raksha's heightened confidentiality requirements (Sprint 25), this discovery layer must be far more restrictive than Sprints 19 and 24.

### Scope
- Define a heavily access-gated, read-only index over case existence and resolution-status data (not full report content).
- Define exactly which constitutionally designated roles may query this index and under what referential scope (e.g., an institution role may query cases referencing its own INS, not the whole ecosystem).
- Every query against this discovery layer must itself emit an Event Record via the Shared Event History Foundation (Sprint 15), given the sensitivity of the data domain — this is the same mechanism used by every other module, not a Raksha-specific audit subsystem.

### Reuse Requirements
- Must reuse the case/report and resolution architecture from Sprints 26–27 as source-of-truth; discovery holds no primary data.
- Must reuse the general read-only discovery-layer principle from Sprints 19 and 24, adapted with stricter gating.
- Must reuse the Shared Event History Foundation (Sprint 15) for query logging; must not implement a bespoke query-audit subsystem.

### Constitutional Rules
- This discovery layer must never expose original report narrative content — only existence, category, and resolution-status level data, subject to role-scoped access.
- Every query against this discovery layer is logged exclusively through a Sprint 15 Event Record, registered as its own event type (e.g., `raksha.discovery.query_executed`), distinct from the case action events in Sprint 27.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No exposure of report narrative content through discovery.
- No mutation of case, resolution, or action data from within discovery.
- No ecosystem-wide unrestricted query capability for any role.
- No analytics, trend-scoring, or pattern-detection algorithms.
- No module-local query-logging mechanism — this is now exclusively Sprint 15's responsibility.

### Expected Deliverables
- Access-gated discovery index architecture.
- Role-scoped query boundary rules.
- Confirmation that every discovery query maps to a Sprint 15 Event Record, with the specific event type this module registers for query logging.

### Engineering Review Checklist
- [ ] Is report narrative content confirmed excluded from discovery results?
- [ ] Is role-scoped access explicitly bounded (no ecosystem-wide unrestricted query)?
- [ ] Does every discovery query emit a Sprint 15 Event Record rather than a local logging mechanism?

### Dependencies on Previous Sprints
- Requires: Sprint 26, Sprint 27, Sprint 25, Sprint 15 (Shared Event History Foundation).

### What Becomes Frozen After Approval
- Discovery index architecture and its restricted-exposure rules.
- Role-scoped query boundaries.
- The registered Raksha query-logging event type.
- Raksha is now considered **feature-complete** at the backend architectural level.

---

# PART D — ECOSYSTEM CLOSURE

---

## Sprint 29: Cross-Ecosystem Integration Layer

### Objective
Define the constitutional rules governing how Tattvaloka, Tattvapeetha, and Raksha — each now feature-complete in isolation — may reference one another, without merging their data models or violating any module's individual constitutional boundaries.

### Problem Being Solved
Each module was deliberately built in isolation to preserve single-responsibility architecture. However, real ecosystem use requires certain cross-module references (e.g., a Raksha case referencing a Tattvapeetha standing, or a Tattvaloka discovery result reflecting an institution's Tattvapeetha affiliation). Without this sprint, such references risk being implemented ad hoc and inconsistently.

### Why This Sprint Exists
This is the only sprint in the roadmap whose explicit purpose is cross-module reference architecture. It must come last among the application-module sprints because it depends on all of them being individually frozen first.

### Scope
- Define the constitutional principle that all cross-module references occur strictly through public identifiers (TMP/TRK/INS/UUID-derived, never raw UUID) and never through direct database-level joins across module boundaries.
- Define a canonical, ecosystem-wide reference-resolution pattern that all three modules (and any future modules) must use identically.
- Define which specific cross-module references are constitutionally sanctioned at this time (e.g., Raksha → Tattvapeetha standing reference; Tattvaloka discovery → Tattvapeetha institutional affiliation), and explicitly enumerate that this list is closed unless amended by a future constitutional sprint.

### Reuse Requirements
- Must reuse every module's already-frozen discovery layer (Sprints 19, 24, 28) as the only sanctioned entry point for cross-module reads.
- Must not introduce any new identity, content, or membership structures.

### Constitutional Rules
- No module may directly query another module's internal (non-discovery-layer) data store under any circumstance.
- **Cross-module communication must occur only through each module's public service interface (its frozen discovery layer, or a future constitutionally sanctioned interface). Direct repository-to-repository or database-to-database access between modules is constitutionally prohibited, regardless of implementation convenience.**
- All cross-module references must be resolved through public identifiers and each module's own frozen discovery layer.
- The list of sanctioned cross-module reference types is closed at the time of this sprint's approval; expanding it requires a dedicated future constitutional amendment sprint, not an implementation-level decision.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No new business logic within any individual module (Tattvaloka, Tattvapeetha, and Raksha are already feature-complete).
- No direct cross-module database joins or repository-to-repository access of any kind.
- No new identifier formats.
- No frontend aggregation or presentation logic.

### Expected Deliverables
- Cross-ecosystem reference-resolution architecture.
- Closed enumeration of sanctioned cross-module reference types.
- Explicit statement of the amendment process required to expand that enumeration in the future.
- Explicit statement of the repository-isolation rule as a standalone, quotable constitutional clause (see Constitutional Rules above).

### Engineering Review Checklist
- [ ] Are all cross-module references confirmed to route only through frozen discovery layers or sanctioned service interfaces?
- [ ] Is the enumeration of sanctioned reference types explicitly closed?
- [ ] Is it architecturally impossible for one module to directly query another's internal store or repository?

### Dependencies on Previous Sprints
- Requires: Sprint 19, Sprint 24, Sprint 28 (all module discovery layers), and therefore implicitly all prior sprints in Parts A0–C.

### What Becomes Frozen After Approval
- Cross-ecosystem reference-resolution architecture.
- Closed enumeration of sanctioned cross-module references.
- The repository-isolation constitutional clause.
- The amendment process required to expand cross-module references in the future.

---

## Sprint 30: Final Constitutional Freeze & Backend Completion Audit

### Objective
Formally close the backend constitutional roadmap by auditing every prior sprint (1–29) for internal consistency, freezing shared cross-cutting standards, and declaring the Traksha Core backend constitutionally complete.

### Problem Being Solved
Without a formal closure sprint, there is no single point at which the ecosystem can be declared architecturally whole, no place for cross-cutting API-shape standards to be constitutionally frozen without bloating every module sprint with repetition, and no defined process for what happens if a future need arises that no existing sprint covers.

### Why This Sprint Exists
Every constitutional system requires a defined closure and amendment procedure; otherwise "frozen" sprints have no formal mechanism protecting them from informal, undocumented drift during future implementation work. Additionally, certain low-level conventions (pagination, filtering, sorting, response shape) are common to every module's read interfaces and are more appropriately frozen once, here, than repeated in every discovery sprint.

### Scope
- Conduct a cross-sprint consistency audit: confirm no two sprints define conflicting rules for the same architectural concern (identity, immutability, event history, discovery, access control).
- Confirm every application module (Tattvaloka, Tattvapeetha, Raksha) reached feature-completion through its own dedicated phase sequence, with no skipped architectural responsibility.
- Freeze a single, ecosystem-wide **Standard Response & Query Convention**, covering: pagination shape, filtering conventions, sorting conventions, cursor-based navigation, and a standard response envelope structure — to be applied uniformly by every module's discovery and read-facing interfaces (Sprints 19, 24, 28, and any future equivalents), without requiring any individual module sprint to redefine it.
- Formally declare the full sprint range (1–29) constitutionally frozen in aggregate, superseding any individual sprint-level freeze language with one ecosystem-wide freeze declaration.
- Define the constitutional amendment procedure: how any future backend need (not covered by Sprints 1–29) must be proposed as a new, dedicated constitutional amendment sprint — never as an ad hoc modification to an existing frozen sprint.

### Reuse Requirements
- Must reuse and reference every prior sprint's "What Becomes Frozen After Approval" section as the audit checklist for this sprint.
- The Standard Response & Query Convention must be defined once, here, and reused by reference by every existing and future discovery/read-facing sprint — it must not be re-litigated per module.

### Constitutional Rules
- No sprint from 1–29 may be modified, reinterpreted, or reopened by this sprint or any future work; this sprint only audits and formally seals them.
- The Standard Response & Query Convention, once frozen here, applies retroactively-by-reference to Sprints 19, 24, and 28 (i.e., those sprints' discovery layers must conform to it), without those sprints themselves being reopened or edited.
- Any future backend requirement must be addressed through a new, explicitly numbered constitutional amendment sprint that itself follows the same documentation structure as every sprint in this roadmap (Objective, Problem, Scope, Constitutional Rules, Boundaries, Deliverables, Review Checklist, Dependencies, Freeze declaration).
- **Future modules must reuse the frozen constitutional foundations (Identity, Public Identifiers, Event History, Authorization, Discovery Pattern, Response Convention) and may extend the ecosystem only through new numbered constitutional amendment sprints. Existing frozen foundations must never be duplicated or forked.**
- This roadmap, once this sprint is approved, is the permanent and complete constitutional record of Traksha Core backend architecture until such time as a new amendment sprint is constitutionally ratified.

### Explicit Boundaries — Things That MUST NOT Be Implemented
- No new business logic of any kind.
- No modification of any prior sprint's frozen rules.
- No frontend, deployment, or operational concerns.
- No search-engine-specific implementation detail within the Standard Response & Query Convention — it defines shape and contract, not technology choice.

### Expected Deliverables
- Cross-sprint consistency audit report (architectural, not code).
- Standard Response & Query Convention specification (pagination, filtering, sorting, cursor navigation, response envelope).
- Formal ecosystem-wide freeze declaration covering Sprints 1–29.
- Documented constitutional amendment procedure for all future backend needs, including the future-module foundation-reuse clause.

### Engineering Review Checklist
- [ ] Has every sprint's frozen output been cross-checked for conflicts with every other sprint?
- [ ] Is the Standard Response & Query Convention defined exactly once and referenced (not duplicated) by every discovery sprint?
- [ ] Is the ecosystem-wide freeze declaration formally documented?
- [ ] Is the amendment procedure for future needs explicitly defined and does it require a new dedicated sprint rather than in-place edits?

### Dependencies on Previous Sprints
- Requires: All Sprints 1–29.

### What Becomes Frozen After Approval
- The entirety of Sprints 1–29, as an aggregate, ecosystem-wide constitutional record.
- The Standard Response & Query Convention, applied by reference across all discovery/read-facing sprints.
- The constitutional amendment procedure governing all future backend work, including the requirement that future modules reuse frozen foundations rather than duplicate or fork them.
- **The Traksha Core backend is, upon this sprint's approval, constitutionally complete.**

---

## Amendment Log

**Amendment A (applied in v1.1):** Resolved an inconsistency identified in roadmap review, where "audit trail" was referenced in module-level sprints without a common definition, while generic audit logging had been implicitly excluded elsewhere. Resolution: introduced Sprint 15, Shared Event History & Audit Foundation, as the single ecosystem-wide mechanism for all state-transition and query history. All references to "audit trail" in module-level sprints were replaced with explicit reuse of this foundation. Sprint numbering shifted by +1 from the original v1.0 draft (original Sprints 15–29 are now 16–30).

**Additional refinements folded into Amendment A:**
- Added an explicit repository-isolation constitutional clause to the Cross-Ecosystem Integration Layer sprint (now Sprint 29), prohibiting direct repository-to-repository or database-to-database access between modules.
- Added a Standard Response & Query Convention (pagination, filtering, sorting, cursor navigation, response envelope) to the Final Constitutional Freeze & Backend Completion Audit sprint (now Sprint 30), frozen once and reused by reference across all discovery sprints, rather than repeated per module.
- Added a future-module foundation-reuse clause to Sprint 30's constitutional rules: any future module (frontend, mobile, or new backend module) must reuse the frozen constitutional foundations — Identity, Public Identifiers, Event History, Authorization, Discovery Pattern, Response Convention — and may only extend the ecosystem through new numbered amendment sprints; existing frozen foundations may never be duplicated or forked.
- Confirmed Discovery & Search sprints remain technology-agnostic (no commitment to a specific search engine), preserving flexibility for future implementation choices such as Elasticsearch/OpenSearch.

Total sprint count after Amendment A: **30** (Sprints 1–14 frozen pre-existing, Sprints 15–30 defined in this document).

*End of Constitutional Backend Roadmap.*
