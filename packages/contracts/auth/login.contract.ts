// AUTO-GENERATED — do not edit manually.
// Source:     auth/login.spec.md  (v1.0.0)
// Regenerate: npm run gen:contracts

import { z } from 'zod'

// LoginInput
export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

// LoginSuccess
export const LoginSuccessSchema = z.object({
  userId: z.string().uuid(),
  accessToken: z.string().min(1),
})
export type LoginSuccess = z.infer<typeof LoginSuccessSchema>

// LoginError
export const LoginErrorSchema = z.object({
  code: z.enum(['INVALID_CREDENTIALS', 'ACCOUNT_LOCKED', 'RATE_LIMITED']),
  message: z.string().min(1),
})
export type LoginError = z.infer<typeof LoginErrorSchema>

// Examples — consumed by scripts/verify-contracts.mjs (semantic smoke)
export const loginContractExamples = {
  "validInput": {
    "email": "user@example.com",
    "password": "secret123"
  },
  "invalidInput": {
    "email": "not-an-email",
    "password": "123"
  },
  "validSuccess": {
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "accessToken": "tok_example"
  },
  "invalidSuccess": {
    "userId": "not-a-uuid"
  },
  "validError": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect."
  },
  "invalidError": {
    "code": "UNKNOWN_CODE",
    "message": "test"
  }
} as const
