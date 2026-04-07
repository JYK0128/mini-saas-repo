import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nModule } from 'nestjs-i18n';

import { Account, Invitation, Member, Organization, OrganizationType, RoleType, Term, TermAgreement, TermCategory, User, Verification } from '@/entities';
import i18nConfig from '@/i18n.config';
import ormConfig from '@/mikro-orm.config';

describe('Test', () => {
  let em: EntityManager;
  let app: TestingModule;
  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) =>
    RequestContext.create(em, () => callback(em));

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot(ormConfig),
        MikroOrmModule.forFeature([
          User,
          Verification,
          TermCategory,
          Term,
          TermAgreement,
          Account,
          Invitation,
          Organization,
          Member,
        ]),
        I18nModule.forRoot(i18nConfig),
      ],
    }).compile();

    em = app.get<EntityManager>(EntityManager);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('test', () => {
    it('test01', async () => {
      await withRequestContext(async () => {
        const org = await em.findOne(User, {
          member: {
            role: RoleType.OWNER,
            organization: { metadata: { type: OrganizationType.PLATFORM } },
          },
        });
        expect(org).toBeDefined();
      });
    });
  });
});
