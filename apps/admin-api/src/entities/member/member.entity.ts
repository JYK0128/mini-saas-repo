import { type Rel } from '@mikro-orm/core';
import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, OneToOne } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import { MemberCore } from './member.core.interface';
import { MemberRepository } from './member.repository';

export enum RoleType {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity({
  schema: 'platform',
  repository: () => MemberRepository,
})
export class Member
  extends CoreEntity<Member>
  implements MemberCore {
  [EntityRepositoryType]?: MemberRepository;

  @ManyToOne({ entity: () => Organization })
  @ApiProperty({ $ref: '#/components/schemas/Organization' })
  organization!: Rel<Organization>;

  @OneToOne({ entity: () => User, inversedBy: (u) => u.member, owner: true })
  @ApiProperty({ $ref: '#/components/schemas/User' })
  user!: Rel<User>;

  @Enum(() => RoleType)
  @ApiProperty({ enum: RoleType })
  role!: RoleType;
}
