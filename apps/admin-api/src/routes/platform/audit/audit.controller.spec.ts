/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable sonarjs/no-hardcoded-passwords */
import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Account, Member, Organization, OrganizationMetadata, OrganizationType, ProviderType, RoleType, Session, User } from '@/entities';

describe('AuditController (E2E)', () => {
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
      const user = em.create(User, {
        email,
        name,
        emailVerified: true,
      });

      em.create(Account, {
        user,
        accountId: email,
        providerId: ProviderType.CREDENTIAL,
        password: passwordHash,
      });

      const organization = em.create(Organization, {
        name: `${name}'s Org`,
        metadata: new OrganizationMetadata(orgType),
      });

      em.create(Member, {
        user,
        organization,
        role,
      });

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

  const testEmails = [
    'platform-admin-audit@test.com',
    'service-owner-audit@test.com',
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    orm = app.get(MikroORM);
    await app.init();

    for (const email of testEmails) {
      await cleanupUserByEmail(email);
    }
  });

  afterAll(async () => {
    for (const email of testEmails) {
      await cleanupUserByEmail(email);
    }
    await app.close();
  });

  describe('Audit Symmetrical Access', () => {
    const password = 'TestPassword123!';
    let platformAdminCookie: string;
    let serviceOwnerCookie: string;

    beforeAll(async () => {
      await createTestUser({
        email: 'platform-admin-audit@test.com',
        password,
        name: 'Platform Admin',
        role: RoleType.ADMIN,
        orgType: OrganizationType.PLATFORM,
      });

      await createTestUser({
        email: 'service-owner-audit@test.com',
        password,
        name: 'Service Owner',
        role: RoleType.OWNER,
        orgType: OrganizationType.BUSINESS,
      });

      platformAdminCookie = await loginAndGetCookie('platform-admin-audit@test.com', password);
      serviceOwnerCookie = await loginAndGetCookie('service-owner-audit@test.com', password);
    });

    it('GET /platform/audit should allow Platform Admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/platform/audit')
        .set('Cookie', platformAdminCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('GET /platform/audit should forbid Service Owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/platform/audit')
        .set('Cookie', serviceOwnerCookie)
        .expect(403);

      expect(res.status).toBe(403);
    });

    it('GET /service/audit should allow Service Owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/audit')
        .set('Cookie', serviceOwnerCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('GET /service/audit should forbid Platform Admin (wrong org type)', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/audit')
        .set('Cookie', platformAdminCookie)
        .expect(403);

      expect(res.status).toBe(403);
    });
  });
});
