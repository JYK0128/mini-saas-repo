import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { CoreEntity } from '../_common/core.entity';
import { VerificationCore } from './verification.core.interface';
import { VerificationRepository } from './verification.repository';

@Entity({
  schema: 'platform',
  repository: () => VerificationRepository,
})
export class Verification
  extends CoreEntity<Verification>
  implements VerificationCore {
  [EntityRepositoryType]?: VerificationRepository;

  @Property({ type: 'string' })
  identifier!: string;

  @Property({ type: 'string' })
  value!: string;

  @Property({ type: 'datetime', nullable: true })
  verifiedAt?: Date;

  @Property({ type: 'datetime' })
  expiresAt!: Date;

  @Property({ type: 'string', unique: true })
  throttleKey!: string;
}
