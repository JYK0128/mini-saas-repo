import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { Cookie, SessionData } from 'express-session';
import { Store } from 'express-session';

import { OrganizationRole, Session as SessionEntity, TermAgreement, User } from '@/entities';

declare module 'express-session' {
  interface SessionData {
    user: User
    permissions: string[]
    twoFactorPending: boolean
    needsTermAgreement: boolean
  }
}

@Injectable()
export class SessionStore extends Store {
  constructor(private readonly em: EntityManager) {
    super();
  }

  private run<T>(fn: (em: EntityManager) => Promise<T>) {
    return Promise.resolve(fn(this.em));
  }

  private resolveExpires(session: SessionData): Date {
    const cookie = session.cookie as Cookie & { _expires?: Date };
    // 쿠키 만료일시
    if (cookie._expires) {
      return cookie._expires;
    }
    // 쿠키 만료최대시간
    if (cookie.originalMaxAge) {
      return new Date(Date.now() + cookie.originalMaxAge);
    }
    // 비정상 케이스
    return new Date(Date.now() + 1000 * 60 * 60);
  }

  /**
   * Get Session
   */
  get(sid: string, callback: (err: unknown, session?: SessionData | null) => void) {
    this.run(async (em) => {
      const session = await em
        .getRepository(SessionEntity)
        .findSession(sid);
      if (!session) return null;

      let permissions: string[] = [];
      if (session.user.member) {
        const orgRoles = await em
          .getRepository(OrganizationRole)
          .findOrganizationRoles(session.user.member);
        permissions = orgRoles.map((p) => p.permission);
      }

      // termAgreements
      const repo = em.getRepository(TermAgreement);
      const agreements = await repo.findActiveAgreementsByUser(session.user);
      const history = await repo.findAgreementsHistory(session.user);

      const agreedCategoryIds = new Set(history.map((h) => h.term.category.id));
      const needsTermAgreement = agreements.some((term) => {
        if (!term.agreementId) {
          if (term.termType === 'optional') {
            return agreedCategoryIds.has(term.categoryId);
          }
          return true;
        }
        return false;
      });

      return {
        user: session.user,
        permissions,
        twoFactorPending: !!session.user.twoFactorEnabled,
        needsTermAgreement: needsTermAgreement,
        cookie: session.metadata?.cookie as SessionData['cookie'],
      };
    })
      .then((sessionData) => callback(null, sessionData))
      .catch((err) => callback(err, null));
  }

  /**
   * Set Session
   */
  set(sid: string, session: SessionData, callback?: (err?: unknown) => void) {
    this.run(async (em) => {
      if (!session.user) {
        throw new Error('invalid session: missing user');
      }

      const expiresAt = this.resolveExpires(session);
      const data = em.create(SessionEntity, {
        token: sid,
        user: session.user,
        expiresAt,
        metadata: {
          cookie: session.cookie,
          twoFactorPending: session.twoFactorPending,
          needsTermAgreement: session.needsTermAgreement,
        },
      });

      await em.upsert(SessionEntity, data, {
        onConflictFields: ['token'],
      });
    })
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  /**
   * Destroy Session
   */
  destroy(sid: string, callback?: (err?: unknown) => void) {
    this.run(async (em) => {
      await em.nativeDelete(SessionEntity, { token: sid });
    })
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }
}
