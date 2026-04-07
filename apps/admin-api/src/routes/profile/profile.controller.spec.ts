/* eslint-disable sonarjs/no-hardcoded-passwords */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { EntityManager, RequestContext } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Account, ProviderType, User } from '@/entities';

describe('ProfileController (e2e)', () => {
  let em: EntityManager;
  let app: INestApplication;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) =>
    RequestContext.create(em, () => {
      const forkedEm = RequestContext.getEntityManager() as EntityManager;
      return callback(forkedEm);
    });

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

  describe('authenticated profile endpoints', () => {
    let testUserId: string;
    let authCookie: string;
    const email = `e2e-profile-${Date.now()}@test.com`;
    const password = 'pass123';

    beforeAll(async () => {
      await withRequestContext(async (forkedEm) => {
        const user = forkedEm.create(User, {
          name: 'E2E Profile User',
          email,
          emailVerified: true,
        });

        forkedEm.create(Account, {
          user,
          accountId: email,
          providerId: ProviderType.CREDENTIAL,
          password: await bcrypt.hash(password, 10),
          failCount: 0,
        });

        forkedEm.persist(user);
        await forkedEm.flush();
        testUserId = user.id;
      });

      const loginRes = await request(app.getHttpServer())
        .post('/sign-in/login')
        .send({ accountId: email, password });

      authCookie = loginRes.header['set-cookie'];
    });

    afterAll(async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOne(User, testUserId, { populate: ['account'] });
        if (user) {
          await forkedEm.remove(user).flush();
        }
      });
    });

    it('GET /profile should return own profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/profile')
        .set('Cookie', authCookie)
        .expect(200);

      expect(res.body.data.id).toBe(testUserId);
      expect(res.body.data.email).toBe(email);
    });

    it('PATCH /profile should update profile name in session', async () => {
      const res = await request(app.getHttpServer())
        .patch('/profile')
        .set('Cookie', authCookie)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.data).toBe(true);

      const getRes = await request(app.getHttpServer())
        .get('/profile')
        .set('Cookie', authCookie);

      expect(getRes.body.data.name).toBe('Updated Name');
    });

    it('POST /profile/2fa/setup should generate 2FA secret', async () => {
      const res = await request(app.getHttpServer())
        .post('/profile/2fa/setup')
        .set('Cookie', authCookie)
        .expect(201);

      expect(res.body.data.secret).toBeDefined();
    });
  });
});
