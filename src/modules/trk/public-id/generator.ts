import { randomBytes } from 'node:crypto';

// ─── Public ID alphabet ───────────────────────────────────────────────────────
// Uppercase alphanumeric: A–Z (26) + 0–9 (10) = 36 characters.
// Only uppercase so identifiers are visually unambiguous and case-insensitive
// safe in any downstream system that normalises to uppercase.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ALPHABET_SIZE = ALPHABET.length; // 36

// Rejection threshold: largest multiple of ALPHABET_SIZE within a single byte
// (0–255). Using only values below this threshold guarantees each character
// is equally likely — no character is more probable than any other.
// 36 × 7 = 252; bytes 252–255 are discarded (rejection rate ≈ 1.6 %).
const REJECT_ABOVE = Math.floor(256 / ALPHABET_SIZE) * ALPHABET_SIZE; // 252

// ─── Secure segment generator ─────────────────────────────────────────────────
// Produces exactly `length` uniformly-distributed uppercase alphanumeric
// characters using Node's `crypto.randomBytes`. Rejection sampling eliminates
// the modulo bias that arises because 256 is not divisible by 36.
//
// Over-provisioning the byte buffer (×2) reduces the expected number of
// `randomBytes()` calls to one per invocation in the vast majority of cases.
function generateSegment(length: number): string {
  const result: string[] = [];
  while (result.length < length) {
    const needed = length - result.length;
    const bytes = randomBytes(needed * 2);
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      const byte = bytes[i]!;
      if (byte < REJECT_ABOVE) {
        result.push(ALPHABET[byte % ALPHABET_SIZE]!);
      }
    }
  }
  return result.join('');
}

// ─── TMP identifier ────────────────────────────────────────────────────────────
// Format: TMP-XXXXXXXXXXXXXXXX  (16 uppercase alphanumeric characters)
// Issued immediately after successful dual-channel verification.
// Represents a temporary constitutional identity.
export function generateTmpId(): string {
  return `TMP-${generateSegment(16)}`;
}

// ─── TRK identifier ────────────────────────────────────────────────────────────
// Format: TRK-XXXXXXXXXXXXXXXX  (16 uppercase alphanumeric characters)
// Generated completely independently — NEVER derived from the TMP identifier.
// Issued only when a TMP identity is constitutionally upgraded to TRK.
export function generateTrkId(): string {
  return `TRK-${generateSegment(16)}`;
}

// ─── INS identifier ────────────────────────────────────────────────────────────
// Format: INS-XXXXXXXXXXXX  (12 uppercase alphanumeric characters)
// Institution identities only. The distinct prefix ensures INS identifiers
// can never collide with TMP or TRK identifiers at the string level.
export function generateInsId(): string {
  return `INS-${generateSegment(12)}`;
}
