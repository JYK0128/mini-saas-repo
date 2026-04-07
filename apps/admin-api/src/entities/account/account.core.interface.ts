import { User } from '../user/user.entity';
import type { ProviderType } from './account.entity';

/**
 * @url https://www.better-auth.com/docs/concepts/database#account
 */
export interface AccountCore {
  user: User
  accountId: string
  providerId: ProviderType
  accessToken?: string
  refreshToken?: string
  accessTokenExpiresAt?: Date
  refreshTokenExpiresAt?: Date
  scope?: string
  idToken?: string
  password?: string
}
