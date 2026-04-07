/* eslint-disable sonarjs/no-hardcoded-passwords */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { EntityManager, RequestContext } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Account, Invitation, Member, Organization, OrganizationRole, Term, TermAgreement, TermCategory, TermType, User, Verification } from '@/entities';

describe('SignUpController (e2e)', () => {
  let em: EntityManager;
  let app: INestApplication;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) =>
    RequestContext.create(em, () => callback(em));

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    em = app.get<EntityManager>(EntityManager);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Sign-Up flows', () => {
    let testTermId: string;
    let testCategoryId: string;

    beforeAll(async () => {
      await withRequestContext(async (forkedEm) => {
        // Clean start: remove any leftovers from previous failed runs
        const existingCategory = await forkedEm.findOne(TermCategory, { title: 'E2E Required Term' });
        if (existingCategory) {
          await forkedEm.nativeDelete(Term, { category: existingCategory.id });
          await forkedEm.nativeDelete(TermCategory, { id: existingCategory.id });
        }

        const category = forkedEm.create(TermCategory, {
          title: 'E2E Required Term',
          termType: TermType.REQUIRED,
          isActive: true,
        });
        const term = forkedEm.create(Term, {
          category,
          content: 'Contant',
          version: '1.0',
          startDate: new Date(),
          endDate: new Date(Date.now() + 1000 * 60 * 60),
        });
        forkedEm.persist([category, term]);
        await forkedEm.flush();
        testTermId = term.id;
        testCategoryId = category.id;
      });
    });

    afterEach(async () => {
      await withRequestContext(async (forkedEm) => {
        // 1. Find and delete e2e users
        const users = await forkedEm.find(User, { email: { $like: 'e2e-signup-%' } });
        const userIds = users.map((u) => u.id);

        if (userIds.length > 0) {
          // 2. Delete dependents on User
          await forkedEm.nativeDelete(Member, { user: { $in: userIds } });
          await forkedEm.nativeDelete(Account, { user: { $in: userIds } });
          await forkedEm.nativeDelete(TermAgreement, { user: { $in: userIds } });
        }

        // 3. Delete Invitations (by email OR inviter ID)
        await forkedEm.nativeDelete(Invitation, {
          $or: [
            { email: { $like: 'e2e-signup-%' } },
            { inviter: { $in: userIds } },
          ],
        });

        // 4. Clean up any e2e organizations if needed
        const orgs = await forkedEm.find(Organization, { name: { $like: 'e2e-%' } });
        const orgIds = orgs.map((o) => o.id);
        if (orgIds.length > 0) {
          await forkedEm.nativeDelete(Member, { organization: { $in: orgIds } });
          await forkedEm.nativeDelete(OrganizationRole, { organization: { $in: orgIds } });
          await forkedEm.nativeDelete(Organization, { id: { $in: orgIds } });
        }

        // 5. Finally delete Users
        if (userIds.length > 0) {
          await forkedEm.nativeDelete(User, { id: { $in: userIds } });
        }

        // 6. Delete Verifications
        await forkedEm.nativeDelete(Verification, {
          $or: [
            { identifier: { $like: 'e2e-signup-%' } },
            { identifier: { $like: '0103333%' } },
          ],
        });

        await forkedEm.flush();
      });
    });

    afterAll(async () => {
      await withRequestContext(async (forkedEm) => {
        // Delete shared Terms and Categories
        if (testCategoryId) {
          await forkedEm.nativeDelete(Term, { category: testCategoryId });
          await forkedEm.nativeDelete(TermCategory, { id: testCategoryId });
        }
        await forkedEm.flush();
      });
    });

    it('GET /sign-up/terms should return terms list', async () => {
      const res = await request(app.getHttpServer())
        .get('/sign-up/terms')
        .query({ email: 'new@test.com' })
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('POST /sign-up/email/validate should check duplicate', async () => {
      const email = `e2e-signup-${Date.now()}@test.com`;
      const res = await request(app.getHttpServer())
        .post('/sign-up/email/validate')
        .send({ email })
        .expect(201);

      expect(res.body.data).toBe(true);

      // create user
      await withRequestContext(async (forkedEm) => {
        const user = forkedEm.create(User, { name: 'E', email, emailVerified: true });
        forkedEm.persist(user);
        await forkedEm.flush();
      });

      const res2 = await request(app.getHttpServer())
        .post('/sign-up/email/validate')
        .send({ email })
        .expect(409);

      expect(res2.status).toBe(409);
    });

    it('POST /sign-up/complete should register user', async () => {
      const email = `e2e-signup-complete-${Date.now()}@test.com`;

      // Fetch all system terms (where organization is null) to satisfy "all required terms" check
      const systemTermIds = await withRequestContext(async (forkedEm) => {
        const terms = await forkedEm.find(Term, {
          category: { organization: null },
        });
        return terms.map((t) => t.id);
      });

      const dto = {
        name: 'New E2E User',
        email,
        phoneNumber: '01033334444',
        phoneNumberVerified: true,
        termIds: [...systemTermIds, testTermId],
        password: 'Password!123',
      };

      const res = await request(app.getHttpServer())
        .post('/sign-up/complete')
        .send(dto);

      expect(res.status).toBe(201);
      expect(res.body.data).toBe(true);

      const user = await withRequestContext((forkedEm) => forkedEm.findOneOrFail(User, { email }));
      expect(user.name).toBe('New E2E User');
    });
  });
});
