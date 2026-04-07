import type { Session } from '@/entities/session/session.entity';

import { CoreRepository } from '../_common/core.repository';

export class SessionRepository extends CoreRepository<Session> {
  findSession(
    sid: string,
  ) {
    return super.findOne(
      {
        token: sid,
        expiresAt: { $gt: new Date() },
      },
      {
        populate: [
          'user',
          'user.account',
          'user.member',
          'user.member.organization',
        ],
      },
    );
  }
}
