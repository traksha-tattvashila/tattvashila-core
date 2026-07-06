import { z } from 'zod';

// ─── Initiate verification ────────────────────────────────────────────────────
// Phone must be in E.164 format as supplied by the client. Normalisation
// (uppercase country code, etc.) is a transport-layer concern; the schema
// validates the format only.
// Email is lowercased during parsing to enforce the normalisation rule from
// the TRK constitutional schema comment.
export const InitiateVerificationSchema = z.object({
  phone: z
    .string()
    .min(1, { message: 'phone is required' })
    .regex(/^\+[1-9]\d{6,14}$/, {
      message: 'phone must be in E.164 format (e.g. +15551234567)',
    }),

  email: z
    .string()
    .min(1, { message: 'email is required' })
    .email({ message: 'email must be a valid email address' })
    .transform((v) => v.toLowerCase()),
});

export type InitiateVerificationInput = z.infer<typeof InitiateVerificationSchema>;

// ─── Confirm verification ─────────────────────────────────────────────────────
// OTP must be a numeric string of the length configured in VerificationPolicy.
// Length bounds match the generator constraints in Sprint 4B (4–10 digits).
export const ConfirmVerificationSchema = z.object({
  otp: z
    .string()
    .min(1, { message: 'otp is required' })
    .regex(/^\d{4,10}$/, {
      message: 'otp must be a numeric string between 4 and 10 digits',
    }),
});

export type ConfirmVerificationInput = z.infer<typeof ConfirmVerificationSchema>;
