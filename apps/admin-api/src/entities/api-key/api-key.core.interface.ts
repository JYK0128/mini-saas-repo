/**
 * @url https://better-auth.com/docs/plugins/api-key/reference#schema
 */
export interface ApiKeyCore {
  configId: string
  referenceId: string
  name?: string
  start?: string
  prefix?: string
  key: string
  refillInterval?: number
  refillAmount?: number
  lastRefillAt?: Date
  enabled: boolean
  rateLimitEnabled: boolean
  rateLimitTimeWindow?: number
  rateLimitMax?: number
  requestCount: number
  remaining?: number
  lastRequest?: Date
  expiresAt?: Date
  permissions?: string
}
