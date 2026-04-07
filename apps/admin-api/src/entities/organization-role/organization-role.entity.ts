import { EntityRepositoryType, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { Organization } from '../organization/organization.entity';
import { OrganizationRoleCore } from './organization-role.core.interface';
import { OrganizationRoleRepository } from './organization-role.repository';

@Entity({
  schema: 'platform',
  repository: () => OrganizationRoleRepository,
})
export class OrganizationRole
  extends CoreEntity<OrganizationRole>
  implements OrganizationRoleCore {
  [EntityRepositoryType]?: OrganizationRoleRepository;

  @ManyToOne({ entity: () => Organization })
  @ApiProperty({ $ref: '#/components/schemas/Organization' })
  organization!: Rel<Organization>;

  @Property({ type: 'string' })
  role!: string;

  @Property({ type: 'string' })
  permission!: string;
}
