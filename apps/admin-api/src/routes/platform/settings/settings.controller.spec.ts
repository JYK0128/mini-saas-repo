/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable sonarjs/no-hardcoded-passwords */
import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Account, Member, Organization, OrganizationMetadata, OrganizationType, ProviderType, RoleType, Session, User } from '@/entities';

describe('SettingsController (E2E)', () => {
  let app: INestApplication;
  let orm: MikroORM;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) => {
    const em = orm.em.fork();
    return RequestContext.create(em, () => callback(em));
  };

  const createTestUser = async ({
    email,
    password,
    name,
    role,
    orgType,
  }: {
    email: string
    password: string
    name: string
    role: RoleType
    orgType: OrganizationType
  }) => {
    const passwordHash = bcrypt.hashSync(password, 10);
    return withRequestContext(async (em) => {
      const user = em.create(User, { email, name, emailVerified: true });
      em.create(Account, { user, accountId: email, providerId: ProviderType.CREDENTIAL, password: passwordHash });
      const organization = em.create(Organization, {
        name: `${name}'s Org`,
        metadata: new OrganizationMetadata(orgType),
      });
      em.create(Member, { user, organization, role });
      await em.flush();
      return { user, organization };
    });
  };

  const cleanupUserByEmail = async (email: string) => {
    await withRequestContext(async (em) => {
      const user = await em.findOne(User, { email }, { populate: ['member.organization'] });
      if (user) {
        const userId = user.id;
        const org = user.member?.organization;
        if (org && org.name.includes(user.name)) {
          const orgId = org.id;
          await em.nativeDelete(Member, { organization: orgId });
          await em.nativeDelete(Organization, { id: orgId });
        }
        await em.nativeDelete(Session, { user: userId });
        await em.nativeDelete(Account, { user: userId });
        await em.nativeDelete(Member, { user: userId });
        await em.nativeDelete(User, { id: userId });
      }
      await em.flush();
    });
  };

  const loginAndGetCookie = async (email: string, password: string) => {
    const response = await request(app.getHttpServer())
      .post('/sign-in/login')
      .send({ accountId: email, password });
    expect(response.status).toBe(201);
    return response.headers['set-cookie'][0];
  };

  const testEmail = 'platform-admin-settings@test.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    orm = app.get(MikroORM);
    await app.init();
    await cleanupUserByEmail(testEmail);
  });

  afterAll(async () => {
    await cleanupUserByEmail(testEmail);
    await app.close();
  });

  describe('Settings API', () => {
    const password = 'TestPassword123!';
    let cookie: string;

    beforeAll(async () => {
      await createTestUser({
        email: testEmail,
        password,
        name: 'Settings Admin',
        role: RoleType.OWNER,
        orgType: OrganizationType.PLATFORM,
      });
      cookie = await loginAndGetCookie(testEmail, password);
    });

    it('GET /platform/settings should return settings', async () => {
      const res = await request(app.getHttpServer())
        .get('/platform/settings')
        .set('Cookie', cookie)
        .expect(200);
      const body = res.body as { success: boolean, data: { maintenanceMode: boolean } };
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('maintenanceMode');
    });

    it('PATCH /platform/settings should update settings', async () => {
      const res = await request(app.getHttpServer())
        .patch('/platform/settings')
        .set('Cookie', cookie)
        .send({ maintenanceMode: true })
        .expect(200);
      const body = res.body as { success: boolean, data: { maintenanceMode: boolean } };
      expect(body.success).toBe(true);
      expect(body.data.maintenanceMode).toBe(true);
    });
  });
});
