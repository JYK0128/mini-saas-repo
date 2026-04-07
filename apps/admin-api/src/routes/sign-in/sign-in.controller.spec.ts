/* eslint-disable sonarjs/no-hardcoded-passwords */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { EntityManager, RequestContext } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';

jest.mock('otplib', () => ({
  verify: jest.fn(),
}));
import { verify } from 'otplib';

import { AppModule } from '@/app.module';
import { Account, Member, ProviderType, Session, User } from '@/entities';

describe('SignInController (e2e)', () => {
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

  describe('Sign-In flows', () => {
    let testUserId: string;
    const password = 'password123';
    const email = `e2e-login-${Date.now()}@test.com`;

    beforeAll(async () => {
      await withRequestContext(async (forkedEm) => {
        // Clean start: remove any leftovers from previous failed runs
        const existingUsers = await forkedEm.find(User, {
          $or: [
            { name: 'E2E Login User' },
            { email: { $like: 'e2e-login-%' } },
          ],
        });
        const existingIds = existingUsers.map((u) => u.id);
        if (existingIds.length > 0) {
          await forkedEm.nativeDelete(Session, { user: { $in: existingIds } });
          await forkedEm.nativeDelete(Member, { user: { $in: existingIds } });
          await forkedEm.nativeDelete(Account, { user: { $in: existingIds } });
          await forkedEm.nativeDelete(User, { id: { $in: existingIds } });
        }
        await forkedEm.flush();
      });
    });

    beforeEach(async () => {
      await withRequestContext(async (forkedEm) => {
        const user = forkedEm.create(User, {
          name: 'E2E Login User',
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
    });

    afterEach(async () => {
      await withRequestContext(async (forkedEm) => {
        const users = await forkedEm.find(User, {
          $or: [
            { name: 'E2E Login User' },
            { email: { $like: 'e2e-login-%' } },
          ],
        });
        const userIds = users.map((u) => u.id);

        if (userIds.length > 0) {
          // Robust cleanup using nativeDelete to avoid cascading/FK issues in tests
          await forkedEm.nativeDelete(Session, { user: { $in: userIds } });
          await forkedEm.nativeDelete(Member, { user: { $in: userIds } });
          await forkedEm.nativeDelete(Account, { user: { $in: userIds } });
          await forkedEm.nativeDelete(User, { id: { $in: userIds } });
        }
        await forkedEm.flush();
      });
    });

    it('POST /sign-in/login should login and return user', async () => {
      const res = await request(app.getHttpServer())
        .post('/sign-in/login')
        .send({ accountId: email, password })
        .expect(201);

      expect(res.body.data.id).toBe(testUserId);
      expect(res.header['set-cookie']).toBeDefined();
    });

    it('POST /sign-in/logout should clear session', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/sign-in/login')
        .send({ accountId: email, password });

      const cookie = loginRes.header['set-cookie'];

      const logoutRes = await request(app.getHttpServer())
        .post('/sign-in/logout')
        .set('Cookie', cookie)
        .expect(201);

      expect(logoutRes.body.data).toBe(true);
    });

    it('POST /sign-in/login should handle 2FA if enabled', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);
        user.twoFactorEnabled = true;
        user.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
        await forkedEm.flush();
      });

      // 1. Initial attempt without token
      const res1 = await request(app.getHttpServer())
        .post('/sign-in/login')
        .send({ accountId: email, password })
        .expect(403);

      expect(res1.body.error.code).toBe('TWO_FACTOR_ENABLED');

      // 2. Success with token
      (verify as jest.Mock).mockResolvedValue({ valid: true });

      const res2 = await request(app.getHttpServer())
        .post('/sign-in/login')
        .send({ accountId: email, password, token: '123456' })
        .expect(201);

      expect(res2.body.data.id).toBe(testUserId);
      (verify as jest.Mock).mockRestore();
    });
  });
});
