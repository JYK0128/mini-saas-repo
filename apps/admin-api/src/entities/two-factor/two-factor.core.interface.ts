import { User } from '../user/user.entity';

/**
 * @url https://www.better-auth.com/docs/concepts/database#two-factor
 */
export interface TwoFactorCore {
  user: User
  secret?: string
  backupCodes?: string
}
