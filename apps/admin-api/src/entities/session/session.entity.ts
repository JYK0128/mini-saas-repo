import { EntityRepositoryType, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import type { IAdminSession } from './session.admin.interface';
import { SessionCore } from './session.core.interface';
import type { IOrganizationSession } from './session.organization.interface';
import { SessionRepository } from './session.repository';

@Entity({
  schema: 'platform',
  repository: () => SessionRepository,
})
export class Session
  extends CoreEntity<Session>
  implements SessionCore, IAdminSession, IOrganizationSession {
  [EntityRepositoryType]?: SessionRepository;

  @ManyToOne({ entity: () => User })
  @ApiProperty({ $ref: '#/components/schemas/User' })
  user!: Rel<User>;

  @Property({ type: 'string', unique: true })
  token!: string;

  @Property({ type: 'datetime' })
  expiresAt!: Date;

  @Property({ type: 'string', nullable: true })
  ipAddress?: string;

  @Property({ type: 'string', nullable: true })
  userAgent?: string;

  @Property({ type: 'string', nullable: true })
  impersonatedBy?: string;

  @ManyToOne({ entity: () => Organization, nullable: true })
  @ApiProperty({ $ref: '#/components/schemas/Organization' })
  activeOrganization?: Rel<Organization>;
}
