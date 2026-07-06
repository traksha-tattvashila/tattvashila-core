---
name: TRK identity state transitions
description: How TMP -> TRK (and any future identity_state change) is made atomic and idempotent without an app-level lock.
---

Constitutional identity state transitions (e.g. TMP -> TRK) are implemented as a single conditional `UPDATE ... WHERE id = ? AND identity_state = '<expected-from-state>'` inside a DB transaction, not a read-then-write or an app-level RecordLock.

**Why:** PostgreSQL's row lock on UPDATE makes the compare-and-swap atomic across concurrent requests — a second concurrent transition on the same id blocks until the first commits, then evaluates its WHERE clause against the already-updated row and matches zero rows. This gives idempotency (repeat attempts error without side effects) and single-writer safety for free, so the RecordLock used by verification orchestration (see verification-concurrency.md) is unnecessary here and was deliberately not reused — don't add it "for consistency" without a reason.

**How to apply:** When adding a new state transition, have the repository return a discriminated outcome (e.g. `NOT_FOUND | ALREADY_<STATE> | TRANSITIONED`) rather than throwing — let the domain service map outcomes to domain errors. Distinguishing "not found" from "already in target state" costs one extra SELECT only on the zero-rows-updated path, run inside the same transaction.
