// ─── Per-record async lock ────────────────────────────────────────────────────
// Provides serialised access to operations that share the same record ID.
// Used by the orchestration service to prevent concurrent confirmation
// requests from racing on the same dual-verification session.
//
// Safety model: JavaScript is single-threaded. Between two await points,
// execution is synchronous, so the check-and-set inside withLock is
// race-free within a single process. Each ID maintains an independent
// lock chain; unrelated IDs never block each other.

export interface RecordLock {
  withLock<T>(id: string, fn: () => Promise<T>): Promise<T>;
}

export function createRecordLock(): RecordLock {
  const pending = new Map<string, Promise<void>>();

  return {
    async withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
      // Drain any queued operation for this id before proceeding.
      // The has() check and set() call below are synchronous, so once
      // this task sets its lock no other task can enter until it finishes.
      while (pending.has(id)) {
        const current = pending.get(id);
        if (current !== undefined) await current;
      }

      let release!: () => void;
      const lock = new Promise<void>((resolve) => {
        release = resolve;
      });
      pending.set(id, lock);

      try {
        return await fn();
      } finally {
        pending.delete(id);
        release();
      }
    },
  };
}
