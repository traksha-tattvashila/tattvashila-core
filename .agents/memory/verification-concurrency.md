---
name: Verification concurrency design
description: The approved locking strategy for concurrent OTP confirmation requests.
---

**Decision (approved at Sprint 4B close):** Option B — per-record mutex inside the
in-memory implementation, preserving the frozen VerificationCache interface unchanged.

**Where it lives:** `src/infrastructure/concurrency/record-lock.ts` — `createRecordLock()`.
The lock is used by the orchestration service (`orchestration-service.ts`), NOT inside the
VerificationCache or the engine. The orchestration service acquires the lock on the session ID
before calling `engine.verify()`, serialising concurrent confirms on the same session.

**Why:** The fetch → store sequence in engine.verify() is non-atomic. Without a lock,
two concurrent confirms on the same session could both read `attempts: 4` against a
`maxAttempts: 5` policy, both increment to 5, and both store — undercounting attempts.

**Scope:** Process-local only. Multi-process / scale-out deployments need a shared lock
(Redis, DB advisory lock, etc.) — this is a known future architectural concern.

**How to apply:** Any new code that reads-then-writes a verification session must acquire
the session lock before the read. Do not add locking inside the cache or engine directly.
