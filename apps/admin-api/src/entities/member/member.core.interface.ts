import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import type { RoleType } from './member.entity';

/**
 * @url https://better-auth.com/docs/plugins/organization#member
 */
export interface MemberCore {
  organization: Organization
  user: User
  role: RoleType
}
