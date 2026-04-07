import { serial } from '@repo/utils';

import { CoreRepository } from '../_common/core.repository';
import { type Organization, OrganizationMetadata, type OrganizationType } from './organization.entity';

export class OrganizationRepository extends CoreRepository<Organization> {
  createOrganization(name: string, type: OrganizationType) {
    return this.create({
      name,
      slug: serial(),
      metadata: new OrganizationMetadata(type),
    }).persist();
  }
}
