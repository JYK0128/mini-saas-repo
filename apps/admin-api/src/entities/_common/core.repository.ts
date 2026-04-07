import type { FilterQuery } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

import type { CoreEntity } from './core.entity';

export abstract class CoreRepository<
  T extends CoreEntity<T, keyof T>,
> extends EntityRepository<T> {
  exist(where: FilterQuery<T>) {
    return this.count(where).then((c) => c > 0);
  }

  persist(entity: T | T[]) {
    return this.em.persist(entity);
  }

  remove(entity: T) {
    return this.em.remove(entity);
  }

  flush() {
    return this.em.flush();
  }

  persistAndFlush(entity: T | T[]) {
    return this.persist(entity).flush();
  }

  removeAndFlush(entity: T) {
    return this.remove(entity).flush();
  }

  softDelete(entity: T) {
    entity.deletedAt = new Date();
    return this.persist(entity);
  }
}
