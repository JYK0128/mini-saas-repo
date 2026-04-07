import type { DB } from '@/database/types/db';

import { CoreRepository } from '../_common/core.repository';
import type { Term } from '../term/term.entity';
import { TermType } from '../term-category/term-category.entity';
import type { User } from '../user/user.entity';
import type { TermAgreement } from './term-agreement.entity';

export class TermAgreementRepository extends CoreRepository<TermAgreement> {
  async findAgreementsHistory(user: User) {
    return this.find({
      user: { id: user.id },
    }, {
      populate: ['term', 'term.category'],
    });
  }

  async findActiveAgreementsByUser(user: User) {
    const now = new Date();
    const kysely = this.em.getKysely<DB>();

    const activeCategoriesQuery = kysely
      .selectFrom('platform.TermCategory as tc')
      .select((eb) => [
        eb.ref('tc.id').as('categoryId'),
        'termType',
        'title',
        'isActive',
        'organizationId',
      ])
      .where('tc.isActive', '=', true)
      .where((eb) => eb.or([
        eb('tc.organizationId', '=', user.member?.organization?.id || null),
        eb('tc.organizationId', 'is', null),
      ]));

    const latestTermsQuery = kysely
      .selectFrom('platform.Term as t2')
      .select((eb) => [
        'categoryId',
        eb.fn.max('startDate').as('latestStartDate'),
      ])
      .where('t2.startDate', '<=', now)
      .where('t2.endDate', '>', now)
      .groupBy('categoryId');

    const agreementsQuery = kysely
      .selectFrom('platform.TermAgreement as ta')
      .select((eb) => [
        eb.ref('ta.id').as('agreementId'),
        'termId',
        'agreedAt',
      ])
      .where('ta.userId', '=', user.id)
      .where('ta.deletedAt', 'is', null);

    return kysely
      .selectFrom('platform.Term as term')
      .innerJoin(activeCategoriesQuery.as('category'), (join) => join
        .onRef('category.categoryId', '=', 'term.categoryId'),
      )
      .innerJoin(latestTermsQuery.as('latest'), (join) => join
        .onRef('latest.categoryId', '=', 'term.categoryId')
        .onRef('latest.latestStartDate', '=', 'term.startDate'),
      )
      .leftJoin(agreementsQuery.as('agreements'), (join) => join
        .onRef('agreements.termId', '=', 'term.id'),
      )
      .selectAll(['term', 'category', 'agreements'])
      .orderBy(() =>
        kysely.case()
          .when('organizationId', 'is', null).then(0)
          .else(1).end(),
      )
      .orderBy(() =>
        kysely.case()
          .when('termType', '=', TermType.REQUIRED).then(0)
          .else(1).end(),
      )
      .execute();
  }

  async createTermAgreement(user: User, term: Term) {
    return Promise.resolve(
      this.create({
        user,
        term,
        agreedAt: new Date(),
      }).persist(),
    );
  }
}
