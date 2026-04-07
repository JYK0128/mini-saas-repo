/**
 * https://www.better-auth.com/docs/plugins/admin#schema
 */
export interface IAdminUser {
  role?: string
  banned?: boolean
  banReason?: string
  banExpires?: Date
}
