import type { DB } from '@/database/types/db';

import { CoreRepository } from '../_common/core.repository';
import { Audit } from './audit.entity';

export class AuditRepository extends CoreRepository<Audit> {
  async searchAudits(params: {
    limit: number
    offset: number
    organizationId?: string
    userId?: string
    url?: string
  }) {
    const kysely = this.em.getKysely<DB>();

    let query = kysely
      .selectFrom('platform.Audit as a')
      .leftJoin('platform.User as u', 'a.userId', 'u.id')
      .leftJoin('platform.Organization as o', 'a.organizationId', 'o.id')
      .select([
        'a.id',
        'a.url',
        'a.method',
        'a.statusCode as statusCode',
        'a.duration',
        'a.createdAt as createdAt',
        'u.name as userName',
        'o.name as organizationName',
      ]);

    if (params.organizationId) {
      query = query.where('a.organizationId', '=', params.organizationId);
    }

    if (params.userId) {
      query = query.where('a.userId', '=', params.userId);
    }

    if (params.url) {
      query = query.where('a.url', 'ilike', `%${params.url}%`);
    }

    return await query
      .orderBy('a.createdAt', 'desc')
      .limit(params.limit)
      .offset(params.offset)
      .execute();
  }
}
