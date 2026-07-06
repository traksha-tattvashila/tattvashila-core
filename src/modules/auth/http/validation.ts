import { z } from 'zod';

// ─── Set credential ───────────────────────────────────────────────────────────
// Password format is validated for presence only here; the policy check
// (length, character classes) is a service-layer concern so the same rule
// applies everywhere a password is accepted, not just at this HTTP boundary.
export const SetCredentialSchema = z.object({
  identityId: z.string().uuid({ message: 'identityId must be a valid UUID' }),
  password: z.string().min(1, { message: 'password is required' }),
});

export type SetCredentialInput = z.infer<typeof SetCredentialSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  contactType: z.enum(['phone', 'email'], {
    message: 'contactType must be one of: phone, email',
  }),
  contactValue: z.string().min(1, { message: 'contactValue is required' }),
  password: z.string().min(1, { message: 'password is required' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Refresh ──────────────────────────────────────────────────────────────────
export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, { message: 'refreshToken is required' }),
});

export type RefreshInput = z.infer<typeof RefreshSchema>;

// ─── Logout ───────────────────────────────────────────────────────────────────
export const LogoutSchema = z.object({
  refreshToken: z.string().min(1, { message: 'refreshToken is required' }),
});

export type LogoutInput = z.infer<typeof LogoutSchema>;
