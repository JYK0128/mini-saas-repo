import { EntityRepositoryType, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { User } from '../user/user.entity';
import { TwoFactorCore } from './two-factor.core.interface';
import { TwoFactorRepository } from './two-factor.repository';

@Entity({
  schema: 'platform',
  repository: () => TwoFactorRepository,
})
export class TwoFactor
  extends CoreEntity<TwoFactor>
  implements TwoFactorCore {
  [EntityRepositoryType]?: TwoFactorRepository;

  @ManyToOne({ entity: () => User })
  @ApiProperty({ $ref: '#/components/schemas/User' })
  user!: Rel<User>;

  @Property({ nullable: true, type: 'string' })
  secret?: string;

  @Property({ type: 'string', nullable: true })
  backupCodes?: string;
}
