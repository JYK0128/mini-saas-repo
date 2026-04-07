import { EntityRepositoryType, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity, Term, User } from '@/entities';

import { TermAgreementRepository } from './term-agreement.repository';

@Entity({
  schema: 'platform',
  repository: () => TermAgreementRepository,
})
export class TermAgreement
  extends CoreEntity<TermAgreement> {
  [EntityRepositoryType]?: TermAgreementRepository;

  @ManyToOne({ entity: () => User })
  @ApiProperty({ $ref: '#/components/schemas/User' })
  user!: Rel<User>;

  @ManyToOne({ entity: () => Term })
  @ApiProperty({ $ref: '#/components/schemas/Term' })
  term!: Rel<Term>;

  @Property({ type: 'datetime', nullable: true })
  agreedAt?: Date;
}
