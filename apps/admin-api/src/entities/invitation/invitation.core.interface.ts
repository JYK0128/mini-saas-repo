import type { RoleType } from '../member/member.entity';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import type { InvitationStatus } from './invitation.entity';

/**
 * @url https://better-auth.com/docs/plugins/organization#invitation
 */
export interface InvitationCore {
  email: string
  inviter: User
  organization: Organization
  role: RoleType
  status: InvitationStatus
  expiresAt: Date
}
