import { z } from 'zod';

// ─── Constitutional public identifier format validation ───────────────────────
// Validates the three constitutional public identifier families.
//
// Length of the random segment after the prefix:
//   TMP — exactly 16 uppercase alphanumeric characters
//   TRK — exactly 16 uppercase alphanumeric characters
//   INS — exactly 12 uppercase alphanumeric characters
//
// The distinct prefix guarantees that a valid TMP, TRK, and INS value can
// never accidentally match each other, even if the random segment were equal.

const ALPHANUM_16 = /^[A-Z0-9]{16}$/;
const ALPHANUM_12 = /^[A-Z0-9]{12}$/;

export const PublicIdSchema = z
  .string()
  .refine(
    (val) => {
      if (val.startsWith('TMP-')) return ALPHANUM_16.test(val.slice(4));
      if (val.startsWith('TRK-')) return ALPHANUM_16.test(val.slice(4));
      if (val.startsWith('INS-')) return ALPHANUM_12.test(val.slice(4));
      return false;
    },
    {
      message:
        'Must be a valid constitutional identifier: TMP-XXXXXXXXXXXXXXXX, TRK-XXXXXXXXXXXXXXXX, or INS-XXXXXXXXXXXX (uppercase alphanumeric segments only).',
    },
  );

export type PublicId = z.infer<typeof PublicIdSchema>;
