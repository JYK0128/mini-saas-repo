/**
 * @url https://www.better-auth.com/docs/concepts/database#verification
 */
export interface VerificationCore {
  identifier: string
  value: string
  expiresAt: Date
}
