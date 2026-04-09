import type { FilterQuery, FindOneOptions, Loaded, QueryOrderMap } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';

export abstract class CoreRepository<
  T extends object,
> extends EntityRepository<T> {
  async findLast<P extends string = never>(
    where: FilterQuery<T>,
    options?: FindOneOptions<T, P>,
  ): Promise<Loaded<T, P> | null> {
    return this.findOne(where, {
      ...options,
      orderBy: { ...options?.orderBy, updatedAt: 'DESC' } as QueryOrderMap<T>,
    });
  }

  async exist(where: FilterQuery<T>) {
    const c = await this.count(where);
    return c > 0;
  }

  flush() {
    return this.em.flush();
  }
}
