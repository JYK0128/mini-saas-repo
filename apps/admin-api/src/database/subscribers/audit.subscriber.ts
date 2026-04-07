import { EntityManager, EventArgs, EventSubscriber } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import { CoreEntity } from '@/entities';

declare module 'nestjs-cls' {
  interface ClsStore {
    requestId: string
    session?: {
      user?: {
        id: string
        name: string
        email: string
        emailVerified: boolean
        member?: {
          id: string
          role: string
          organization: {
            id: string
            name: string
            metadata: {
              type: string
            }
          }
        }
      }
      permissions?: string[]
      twoFactorPending?: boolean
      needsTermAgreement?: boolean
    }
  }
}

@Injectable()
export class AuditSubscriber implements EventSubscriber<CoreEntity> {
  constructor(
    private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {
    this.em.getEventManager().registerSubscriber(this);
  }

  beforeCreate(args: EventArgs<CoreEntity>) {
    const { entity } = args;
    const session = this.cls.get('session');

    if ('createdBy' in entity) {
      entity.createdBy = session?.user?.id;
    }
    if ('updatedBy' in entity) {
      entity.updatedBy = session?.user?.id;
    }
  }

  beforeUpdate(args: EventArgs<CoreEntity>) {
    const { entity } = args;
    const session = this.cls.get('session');

    if ('updatedBy' in entity) {
      entity.updatedBy = session?.user?.id;
    }
  }
}
