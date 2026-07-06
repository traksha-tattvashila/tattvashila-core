import type { VerificationRecord, VerificationStatus } from '../models.js';
import type { VerificationCache } from './verification-cache.js';

// ─── In-memory verification cache ────────────────────────────────────────────
// Implements VerificationCache using a plain Map.
// Suitable for development and single-process deployments.
// For multi-process deployments a Redis-backed implementation satisfying the
// same interface should be substituted without changes to callers.
//
// Expiry policy: lazy eviction on fetch().
// Records past their expiresAt are silently removed and treated as absent.
// No background sweep is performed to keep the implementation dependency-free.
export function createInMemoryVerificationCache(): VerificationCache {
  const store = new Map<string, VerificationRecord>();

  function isExpired(record: VerificationRecord): boolean {
    return record.expiresAt <= new Date();
  }

  return {
    async store(record: VerificationRecord): Promise<void> {
      store.set(record.id, record);
    },

    async fetch(id: string): Promise<VerificationRecord | undefined> {
      const record = store.get(id);

      if (record === undefined) {
        return undefined;
      }

      if (isExpired(record)) {
        store.delete(id);
        return undefined;
      }

      return record;
    },

    async update(id: string, status: VerificationStatus): Promise<boolean> {
      const record = store.get(id);

      if (record === undefined) {
        return false;
      }

      if (isExpired(record)) {
        store.delete(id);
        return false;
      }

      store.set(id, { ...record, status });
      return true;
    },

    async delete(id: string): Promise<void> {
      store.delete(id);
    },
  };
}
