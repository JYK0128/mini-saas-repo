import { Organization } from '../organization/organization.entity';

/**
 * @url https://better-auth.com/docs/plugins/organization#organization-role
 */
export interface OrganizationRoleCore {
  organization: Organization
  role: string
  permission: string
}
