/* eslint-disable sonarjs/no-hardcoded-passwords */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { EntityManager, RequestContext } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Account, Member, Organization, OrganizationMetadata, OrganizationType, ProviderType, RoleType, Session, User } from '@/entities';

describe('BusinessAuditController (e2e)', () => {
  let em: EntityManager;
  let app: INestApplication;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) =>
    RequestContext.create(em, () => callback(em));

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
    return withRequestContext(async (forkedEm) => {
      const user = forkedEm.create(User, {
        email,
        name,
        emailVerified: true,
      });

      forkedEm.create(Account, {
        user,
        accountId: email,
        providerId: ProviderType.CREDENTIAL,
        password: passwordHash,
        failCount: 0,
      });

      const organization = forkedEm.create(Organization, {
        name: `${name}'s Org ${Date.now()}`,
        metadata: new OrganizationMetadata(orgType),
      });

      forkedEm.create(Member, {
        user,
        organization,
        role,
      });

      await forkedEm.flush();
      return { user, organization };
    });
  };

  const cleanupUserByEmail = async (email: string) => {
    await withRequestContext(async (forkedEm) => {
      const user = await forkedEm.findOne(User, { email }, { populate: ['member.organization'] });
      if (user) {
        const userId = user.id;
        const org = user.member?.organization;

        if (org && org.name.includes('Org')) {
          const orgId = org.id;
          await forkedEm.nativeDelete(Member, { organization: orgId });
          await forkedEm.nativeDelete(Organization, { id: orgId });
        }

        await forkedEm.nativeDelete(Session, { user: userId });
        await forkedEm.nativeDelete(Account, { user: userId });
        await forkedEm.nativeDelete(Member, { user: userId });
        await forkedEm.nativeDelete(User, { id: userId });
      }
      await forkedEm.flush();
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
    'service-owner-audit-e2e@test.com',
    'service-member-audit-e2e@test.com',
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    em = app.get<EntityManager>(EntityManager);

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

  describe('GET /service/audit', () => {
    const password = 'TestPassword123!';
    let ownerCookie: string;
    let memberCookie: string;

    beforeAll(async () => {
      await createTestUser({
        email: 'service-owner-audit-e2e@test.com',
        password,
        name: 'Service Owner',
        role: RoleType.OWNER,
        orgType: OrganizationType.BUSINESS,
      });

      await createTestUser({
        email: 'service-member-audit-e2e@test.com',
        password,
        name: 'Service Member',
        role: RoleType.MEMBER,
        orgType: OrganizationType.BUSINESS,
      });

      ownerCookie = await loginAndGetCookie('service-owner-audit-e2e@test.com', password);
      memberCookie = await loginAndGetCookie('service-member-audit-e2e@test.com', password);
    });

    it('should allow BUSINESS OWNER to access audit logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/audit')
        .set('Cookie', ownerCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });

    it('should forbid BUSINESS MEMBER from accessing audit logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/audit')
        .set('Cookie', memberCookie)
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return paginated results with filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/audit')
        .query({ page: 1, limit: 10, url: 'test' })
        .set('Cookie', ownerCookie)
        .expect(200);

      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(10);
    });
  });
});
