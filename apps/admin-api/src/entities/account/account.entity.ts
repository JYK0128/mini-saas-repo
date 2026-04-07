import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Enum, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { User } from '../user/user.entity';
import { AccountCore } from './account.core.interface';
import { AccountRepository } from './account.repository';

export enum ProviderType {
  CREDENTIAL = 'credential',
}

@Entity({
  schema: 'platform',
  repository: () => AccountRepository,
})
export class Account
  extends CoreEntity<Account, 'failCount'>
  implements AccountCore {
  [EntityRepositoryType]?: AccountRepository;

  @OneToOne({ entity: () => User, inversedBy: (u) => u.account, owner: true })
  @ApiProperty({ $ref: '#/components/schemas/User' })
  user!: User;

  @Property({ type: 'string' })
  accountId!: string;

  @Enum(() => ProviderType)
  @ApiProperty({ enum: ProviderType })
  providerId!: ProviderType;

  @Property({ type: 'string', nullable: true })
  accessToken?: string;

  @Property({ type: 'string', nullable: true })
  refreshToken?: string;

  @Property({ type: 'datetime', nullable: true })
  accessTokenExpiresAt?: Date;

  @Property({ type: 'datetime', nullable: true })
  refreshTokenExpiresAt?: Date;

  @Property({ type: 'string', nullable: true })
  scope?: string;

  @Property({ type: 'string', nullable: true })
  idToken?: string;

  @Property({ type: 'string', nullable: true })
  password?: string;

  @Property({ type: 'number' })
  failCount: number = 0;
}
