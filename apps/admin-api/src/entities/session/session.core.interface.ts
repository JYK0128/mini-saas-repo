import { User } from '../user/user.entity';

/**
 * @url https://www.better-auth.com/docs/concepts/database#session
 */
export interface SessionCore {
  user: User
  token: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}
