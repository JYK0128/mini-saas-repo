import type { DB } from '@/database/types/db';

import { CoreRepository } from '../_common/core.repository';
import type { Organization } from '../organization/organization.entity';
import { TermType } from '../term-category/term-category.entity';
import type { Term } from './term.entity';

export class TermRepository extends CoreRepository<Term> {
  async findActiveTerms(organization?: Organization) {
    const now = new Date();
    const kysely = this.em.getKysely<DB>();

    const activeCategoriesQuery = kysely
      .selectFrom('platform.TermCategory as tc')
      .select((eb) => [
        eb.ref('tc.id').as('categoryId'),
        'title',
        'termType',
        'isActive',
        'organizationId',
      ])
      .where('isActive', '=', true)
      .where((eb) => eb.or([
        eb('organizationId', '=', organization?.id ?? null),
        eb('organizationId', 'is', null),
      ]));

    const latestTermsQuery = kysely
      .selectFrom('platform.Term as t')
      .select((eb) => [
        'categoryId',
        eb.fn.max('startDate').as('latestStartDate'),
      ])
      .where('startDate', '<=', now)
      .where('endDate', '>', now)
      .groupBy('categoryId');

    const data = await kysely
      .selectFrom('platform.Term as term')
      .innerJoin(activeCategoriesQuery.as('category'), (join) => join
        .onRef('category.categoryId', '=', 'term.categoryId'),
      )
      .innerJoin(latestTermsQuery.as('latest'), (join) => join
        .onRef('latest.categoryId', '=', 'term.categoryId')
        .onRef('latest.latestStartDate', '=', 'term.startDate'),
      )
      .selectAll(['term', 'category'])
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

    return data;
  }
}
