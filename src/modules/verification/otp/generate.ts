import { randomInt } from 'node:crypto';

// ─── OTP generation ───────────────────────────────────────────────────────────
// Generates a cryptographically secure numeric OTP of exactly `length` digits.
//
// crypto.randomInt(min, max) produces a uniform distribution over [min, max)
// with no modulo bias — safe for security-sensitive token generation.
// The result is zero-padded so single-digit values still fill the declared
// length (e.g. length=6 always returns a six-character string).

export function generateOtp(length: number): string {
  if (length < 4 || length > 10) {
    throw new RangeError(
      `OTP length must be between 4 and 10; received ${length}`,
    );
  }

  const upperBound = 10 ** length;
  const code = randomInt(0, upperBound);
  return code.toString().padStart(length, '0');
}
