/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable sonarjs/no-hardcoded-passwords */
import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Account, Invitation, Member, Organization, OrganizationMetadata, OrganizationType, ProviderType, RoleType, Session, User } from '@/entities';

describe('ServicePlatformController (E2E)', () => {
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
        await em.nativeDelete(Invitation, { inviter: userId });
        await em.nativeDelete(Invitation, { email: user.email });
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
    'service-owner-platform@test.com',
    'service-member-platform@test.com',
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

  describe('Service Platform Access', () => {
    const password = 'TestPassword123!';
    let ownerCookie: string;
    let memberCookie: string;

    beforeAll(async () => {
      await createTestUser({
        email: 'service-owner-platform@test.com',
        password,
        name: 'Service Owner',
        role: RoleType.OWNER,
        orgType: OrganizationType.BUSINESS,
      });

      await createTestUser({
        email: 'service-member-platform@test.com',
        password,
        name: 'Service Member',
        role: RoleType.MEMBER,
        orgType: OrganizationType.BUSINESS,
      });

      ownerCookie = await loginAndGetCookie('service-owner-platform@test.com', password);
      memberCookie = await loginAndGetCookie('service-member-platform@test.com', password);
    });

    it('GET /service/platform/status should allow Service Owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/platform/status')
        .set('Cookie', ownerCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('usage');
    });

    it('GET /service/platform/status should allow Service Member', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/platform/status')
        .set('Cookie', memberCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /service/platform/policy should allow Service Owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/platform/policy')
        .set('Cookie', ownerCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('apiLimit');
    });

    it('GET /service/platform/policy should forbid Service Member', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/platform/policy')
        .set('Cookie', memberCookie)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});
