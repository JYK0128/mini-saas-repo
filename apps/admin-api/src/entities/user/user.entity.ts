import { Collection, EntityRepositoryType, type Rel } from '@mikro-orm/core';
import { Entity, OneToMany, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { TermAgreement } from '@/entities/term-agreement/term-agreement.entity';

import { CoreEntity } from '../_common/core.entity';
import { Account } from '../account/account.entity';
import { Member } from '../member/member.entity';
import { Session } from '../session/session.entity';
import type { IAdminUser } from './user.admin.interface';
import type { IAnonymousUser } from './user.anonymous.interface';
import { UserCore } from './user.core.interface';
import type { IPhoneUser } from './user.phone.interface';
import { UserRepository } from './user.repository';
import type { ITwoFactorUser } from './user.twofactor.interface';

@Entity({
  schema: 'platform',
  repository: () => UserRepository,
})
export class User
  extends CoreEntity<User>
  implements UserCore, IAnonymousUser, IAdminUser, ITwoFactorUser, IPhoneUser {
  [EntityRepositoryType]?: UserRepository;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string', unique: true })
  email!: string;

  @Property({ type: 'boolean' })
  emailVerified!: boolean;

  @Property({ type: 'string', nullable: true })
  image?: string;

  @OneToMany({ entity: () => Session, mappedBy: (s) => s.user })
  @ApiProperty({ type: 'array', items: { $ref: '#/components/schemas/Session' } })
  sessions = new Collection<Session>(this);

  @OneToOne({ entity: () => Account, mappedBy: (a) => a.user, nullable: true })
  @ApiProperty({ $ref: '#/components/schemas/Account' })
  account?: Rel<Account>;

  @OneToOne({ entity: () => Member, mappedBy: (m) => m.user, nullable: true })
  @ApiProperty({ $ref: '#/components/schemas/Member' })
  member?: Rel<Member>;

  @OneToMany({ entity: () => TermAgreement, mappedBy: (ta) => ta.user })
  @ApiProperty({ type: 'array', items: { $ref: '#/components/schemas/TermAgreement' } })
  termAgreements = new Collection<TermAgreement>(this);

  @Property({ type: 'boolean', nullable: true })
  isAnonymous?: boolean;

  @Property({ type: 'string', nullable: true })
  role?: string;

  @Property({ type: 'boolean', nullable: true })
  banned?: boolean;

  @Property({ type: 'string', nullable: true })
  banReason?: string;

  @Property({ type: 'datetime', nullable: true })
  banExpires?: Date;

  @Property({ type: 'boolean', nullable: true })
  twoFactorEnabled?: boolean;

  @Property({ type: 'string', nullable: true })
  twoFactorSecret?: string;

  @Property({ type: 'string', nullable: true })
  phoneNumber?: string;

  @Property({ type: 'boolean', nullable: true })
  phoneNumberVerified?: boolean;
}
