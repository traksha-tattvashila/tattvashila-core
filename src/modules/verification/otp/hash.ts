import { createHash, timingSafeEqual } from 'node:crypto';

// ─── OTP hashing ──────────────────────────────────────────────────────────────
// OTPs are hashed before storage so a cache dump does not expose live codes.
// SHA-256 is appropriate here: OTPs are short-lived and the hash is never
// persisted to the database, so resistance to long-term offline cracking is
// not the threat model. The record ID is mixed in as a per-record salt to
// prevent a single rainbow table from covering all records simultaneously.

export function hashOtp(otp: string, recordId: string): string {
  return createHash('sha256')
    .update(recordId)
    .update(':')
    .update(otp)
    .digest('hex');
}

// ─── OTP comparison ───────────────────────────────────────────────────────────
// Uses timingSafeEqual on fixed-length hex buffers so execution time does not
// leak information about how many characters of a candidate OTP were correct.
//
// Buffer lengths are checked before calling timingSafeEqual because that
// function throws (rather than returning false) when lengths differ.
// candidateHash is always 64 hex characters (SHA-256). If storedHash has any
// other length — indicating a corrupted or mismatched record — the function
// returns false rather than propagating an uncaught exception.

export function verifyOtp(
  candidate: string,
  storedHash: string,
  recordId: string,
): boolean {
  const candidateHash = hashOtp(candidate, recordId);
  const candidateBuf = Buffer.from(candidateHash, 'utf8');
  const storedBuf = Buffer.from(storedHash, 'utf8');

  if (candidateBuf.length !== storedBuf.length) {
    return false;
  }

  return timingSafeEqual(candidateBuf, storedBuf);
}
