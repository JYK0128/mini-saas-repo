import type { Organization } from '../organization/organization.entity';

/**
 * @url https://better-auth.com/docs/plugins/organization#session
 */
export interface IOrganizationSession {
  /**
   * Current active organization context
   */
  activeOrganization?: Organization
}
