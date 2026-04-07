import { OptionalProps, RequestContext } from '@mikro-orm/core';
import { PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@repo/utils';

export abstract class CoreEntity<
  Entity extends object = object,
  Optional extends keyof Entity = never,
> {
  [OptionalProps]?: 'createdAt' | 'updatedAt' | Optional;

  @PrimaryKey({ type: 'string' })
  id: string = uuid();

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'string', nullable: true })
  createdBy?: string;

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'string', nullable: true })
  updatedBy?: string;

  @Property({ type: 'datetime', nullable: true })
  deletedAt?: Date;

  @Property({ type: 'string', nullable: true })
  deletedBy?: string;

  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  async flush() {
    const em = RequestContext.getEntityManager();
    if (!em) throw new Error('EntityManager not found in RequestContext.');
    await em.flush();
    return this;
  }

  persist() {
    const em = RequestContext.getEntityManager();
    if (!em) throw new Error('EntityManager not found in RequestContext.');
    em.persist(this);
    return this;
  }

  remove() {
    const em = RequestContext.getEntityManager();
    if (!em) throw new Error('EntityManager not found in RequestContext.');
    em.remove(this);
    return this;
  }

  softDelete() {
    const em = RequestContext.getEntityManager();
    if (!em) throw new Error('EntityManager not found in RequestContext.');
    this.deletedAt = new Date();
    em.persist(this);
    return this;
  }
}
