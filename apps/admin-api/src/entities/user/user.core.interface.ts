/**
 * @url https://www.better-auth.com/docs/concepts/database#user
 */
export interface UserCore {
  name: string
  email: string
  emailVerified: boolean
  image?: string
}
