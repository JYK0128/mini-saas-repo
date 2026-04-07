import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { CoreEntity } from '../_common/core.entity';
import { ApiKeyCore } from './api-key.core.interface';
import { ApiKeyRepository } from './api-key.repository';

@Entity({
  schema: 'platform',
  repository: () => ApiKeyRepository,
})
export class ApiKey
  extends CoreEntity<ApiKey>
  implements ApiKeyCore {
  [EntityRepositoryType]?: ApiKeyRepository;

  @Property({ type: 'string' })
  configId!: string;

  @Property({ type: 'string' })
  referenceId!: string;

  @Property({ type: 'string', nullable: true })
  name?: string;

  @Property({ type: 'string', nullable: true })
  start?: string;

  @Property({ type: 'string', nullable: true })
  prefix?: string;

  @Property({ type: 'string' })
  key!: string;

  @Property({ type: 'number', nullable: true })
  refillInterval?: number;

  @Property({ type: 'number', nullable: true })
  refillAmount?: number;

  @Property({ type: 'datetime', nullable: true })
  lastRefillAt?: Date;

  @Property({ type: 'boolean' })
  enabled!: boolean;

  @Property({ type: 'boolean' })
  rateLimitEnabled!: boolean;

  @Property({ type: 'number', nullable: true })
  rateLimitTimeWindow?: number;

  @Property({ type: 'number', nullable: true })
  rateLimitMax?: number;

  @Property({ type: 'number' })
  requestCount!: number;

  @Property({ type: 'number', nullable: true })
  remaining?: number;

  @Property({ type: 'datetime', nullable: true })
  lastRequest?: Date;

  @Property({ type: 'datetime', nullable: true })
  expiresAt?: Date;

  @Property({ type: 'string', nullable: true })
  permissions?: string;
}
