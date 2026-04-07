import { CoreRepository } from '../_common/core.repository';
import type { Member } from '../member/member.entity';
import type { OrganizationRole } from './organization-role.entity';

export class OrganizationRoleRepository extends CoreRepository<OrganizationRole> {
  findOrganizationRoles(member: Member) {
    return this.find({
      organization: member.organization.id,
      role: member.role,
    });
  }
}
