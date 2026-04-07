import { CoreRepository } from '../_common/core.repository';
import type { Organization } from '../organization/organization.entity';
import type { User } from '../user/user.entity';
import { type Member, RoleType } from './member.entity';

export class MemberRepository extends CoreRepository<Member> {
  connectMember(user: User, organization: Organization, role: RoleType) {
    return this.create({
      user,
      organization,
      role,
    }).persist();
  }
}
