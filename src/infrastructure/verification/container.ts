import type { VerificationCache } from './cache/verification-cache.js';
import type { VerificationProvider } from './providers/verification-provider.js';

// ─── Verification infrastructure ─────────────────────────────────────────────
// Groups the cache and provider into a single injectable unit.
// This is the shape passed to any module that needs to perform verification.
// It is intentionally decoupled from ServiceContainer — the database is not
// a dependency of the verification infrastructure.
export interface VerificationInfrastructure {
  readonly cache: VerificationCache;
  readonly provider: VerificationProvider;
}

// ─── Factory ─────────────────────────────────────────────────────────────────
// Assembles a VerificationInfrastructure from its constituent parts.
// Concrete implementations of VerificationCache and VerificationProvider are
// supplied by the bootloader (or test setup) at composition time.
export function createVerificationInfrastructure(
  cache: VerificationCache,
  provider: VerificationProvider,
): VerificationInfrastructure {
  return Object.freeze({ cache, provider });
}
