import { Collection, EntityRepositoryType, type Rel } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { Organization } from '../organization/organization.entity';
import { Term } from '../term/term.entity';
import { TermCategoryRepository } from './term-category.repository';

export enum TermType {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
}

@Entity({
  schema: 'platform',
  repository: () => TermCategoryRepository,
})
export class TermCategory
  extends CoreEntity<TermCategory> {
  [EntityRepositoryType]?: TermCategoryRepository;

  @ManyToOne({ entity: () => Organization, nullable: true })
  @ApiProperty({ $ref: '#/components/schemas/Organization' })
  organization?: Rel<Organization>;

  @OneToMany({ entity: () => Term, mappedBy: (tv) => tv.category })
  @ApiProperty({ type: () => Term, isArray: true })
  terms = new Collection<Term>(this);

  @Property({ type: 'string', unique: true })
  title!: string;

  @Enum(() => TermType)
  @ApiProperty({ enum: TermType })
  termType!: TermType;

  @Property({ type: 'boolean' })
  isActive: boolean = true;
}
