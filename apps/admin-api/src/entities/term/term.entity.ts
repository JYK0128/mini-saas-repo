import { EntityRepositoryType, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { TermCategory } from '../term-category/term-category.entity';
import { TermRepository } from './term.repository';

@Entity({
  schema: 'platform',
  repository: () => TermRepository,
})
@Unique({ properties: ['category', 'version'] })
export class Term
  extends CoreEntity<Term> {
  [EntityRepositoryType]?: TermRepository;

  @ManyToOne({ entity: () => TermCategory })
  @ApiProperty({ type: () => TermCategory })
  category!: Rel<TermCategory>;

  @Property({ type: 'text' })
  @ApiProperty()
  content!: string;

  @Property({ type: 'string' })
  @ApiProperty()
  version!: string;

  @Property({ type: 'datetime' })
  @ApiProperty()
  startDate: Date = new Date();

  @Property({ type: 'datetime' })
  @ApiProperty()
  endDate!: Date;
}
