import { EntityRepositoryType, type Rel } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { RoleType } from '../member/member.entity';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import { InvitationCore } from './invitation.core.interface';
import { InvitationRepository } from './invitation.repository';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
}

@Entity({
  schema: 'platform',
  repository: () => InvitationRepository,
})
export class Invitation
  extends CoreEntity<Invitation, 'status'>
  implements InvitationCore {
  [EntityRepositoryType]?: InvitationRepository;

  @Property({ type: 'string' })
  email!: string;

  @ManyToOne({ entity: () => User })
  @ApiProperty({ $ref: '#/components/schemas/User' })
  inviter!: Rel<User>;

  @ManyToOne({ entity: () => Organization })
  @ApiProperty({ $ref: '#/components/schemas/Organization' })
  organization!: Rel<Organization>;

  @Enum(() => RoleType)
  @ApiProperty({ enum: RoleType })
  role!: RoleType;

  @Enum({ items: () => InvitationStatus, default: InvitationStatus.PENDING })
  @ApiProperty({ enum: InvitationStatus })
  status!: InvitationStatus;

  @Property({ type: 'datetime' })
  expiresAt!: Date;

  @Property({ type: 'string' })
  name!: string;
}
