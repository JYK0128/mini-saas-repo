import { Collection, EntityRepositoryType } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, Enum, OneToMany, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { serial } from '@repo/utils';

import { CoreEntity } from '../_common/core.entity';
import { Member } from '../member/member.entity';
import { OrganizationRole } from '../organization-role/organization-role.entity';
import { OrganizationCore } from './organization.core.interface';
import { OrganizationRepository } from './organization.repository';

export enum OrganizationType {
  PLATFORM = 'PLATFORM',
  BUSINESS = 'BUSINESS',
}

@Embeddable()
export class OrganizationMetadata {
  [key: string]: unknown;

  constructor(type: OrganizationType) {
    switch (type) {
      case OrganizationType.PLATFORM:
        this.type = type;
        this.isActive = true;
        this.activatedAt = new Date();
        this.activationExpiresAt = new Date(9999, 11, 31, 23, 59, 59, 999);
        break;
      case OrganizationType.BUSINESS:
        this.type = type;
        this.isActive = false;
        this.trialExpiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        break;
    }
  }

  @Enum(() => OrganizationType)
  @ApiProperty({ enum: OrganizationType })
  type!: OrganizationType;

  @Property({ type: 'datetime', nullable: true })
  trialExpiresAt?: Date;

  @Property({ type: 'boolean' })
  isActive: boolean = false;

  @Property({ type: 'datetime', nullable: true })
  activatedAt?: Date;

  @Property({ type: 'date', nullable: true })
  activationExpiresAt?: Date;

  @Property({ type: 'string', nullable: true })
  customDomain?: string;

  @Property({ type: 'string', nullable: true })
  logoUrl?: string;
}

@Entity({
  schema: 'platform',
  repository: () => OrganizationRepository,
})
export class Organization
  extends CoreEntity<Organization, 'slug' | 'metadata'>
  implements OrganizationCore {
  [EntityRepositoryType]?: OrganizationRepository;

  @OneToMany({ entity: () => Member, mappedBy: (m) => m.organization })
  @ApiProperty({ type: 'array', items: { $ref: '#/components/schemas/Member' } })
  members = new Collection<Member>(this);

  @OneToMany({ entity: () => OrganizationRole, mappedBy: (r) => r.organization })
  @ApiProperty({ type: 'array', items: { $ref: '#/components/schemas/OrganizationRole' } })
  roles = new Collection<OrganizationRole>(this);

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string', unique: true })
  slug: string = serial();

  @Property({ type: 'string', nullable: true })
  logo?: string;

  @Embedded({ entity: () => OrganizationMetadata, object: true })
  override metadata: OrganizationMetadata = new OrganizationMetadata(
    OrganizationType.BUSINESS,
  );
}
