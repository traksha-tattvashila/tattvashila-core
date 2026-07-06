import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { AuthError, AuthErrorCode } from './errors.js';

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

// ─── Password hashing ────────────────────────────────────────────────────────
// Uses Node's built-in scrypt KDF (no external hashing dependency). A random
// salt is generated per password and stored alongside the derived key as
// `${saltHex}:${hashHex}` so verification never needs a separate lookup.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

// ─── Password verification ───────────────────────────────────────────────────
// Recomputes the derived key using the stored salt and compares it to the
// stored hash using a timing-safe comparison to avoid leaking match length
// via response timing.
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');

  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  if (derivedKey.length !== expected.length) return false;
  return timingSafeEqual(derivedKey, expected);
}

// ─── Password policy ─────────────────────────────────────────────────────────
// Minimum bar for a production authentication system: length, and a mix of
// character classes so trivially guessable passwords are rejected up front.
const MIN_LENGTH = 12;
const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const DIGIT_RE = /[0-9]/;
const SPECIAL_RE = /[^A-Za-z0-9]/;

export function validatePasswordPolicy(password: string): void {
  const failures: string[] = [];

  if (password.length < MIN_LENGTH) {
    failures.push(`at least ${MIN_LENGTH} characters`);
  }
  if (!UPPERCASE_RE.test(password)) {
    failures.push('at least one uppercase letter');
  }
  if (!LOWERCASE_RE.test(password)) {
    failures.push('at least one lowercase letter');
  }
  if (!DIGIT_RE.test(password)) {
    failures.push('at least one digit');
  }
  if (!SPECIAL_RE.test(password)) {
    failures.push('at least one special character');
  }

  if (failures.length > 0) {
    throw new AuthError(
      `Password does not meet policy requirements: ${failures.join(', ')}.`,
      AuthErrorCode.WEAK_PASSWORD,
    );
  }
}
