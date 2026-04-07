/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable sonarjs/no-hardcoded-passwords */
import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Account, Invitation, Member, Organization, OrganizationMetadata, OrganizationType, ProviderType, RoleType, Session, User } from '@/entities';

describe('TenantController (E2E)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let platformAdminSession: string;
  let serviceOwnerSession: string;
  let businessOrgId: string;

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
      em.persist(user);

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
      em.persist(organization);

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
          await em.nativeDelete(Invitation, { organization: orgId });
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    orm = app.get(MikroORM);

    const adminEmail = 'platform-admin-tenant@test.com';
    const ownerEmail = 'service-owner-tenant@test.com';

    await cleanupUserByEmail(adminEmail);
    await cleanupUserByEmail(ownerEmail);

    await createTestUser({
      email: adminEmail,
      password: 'Password123!',
      name: 'Platform Admin',
      role: RoleType.ADMIN,
      orgType: OrganizationType.PLATFORM,
    });

    const { organization: businessOrg } = await createTestUser({
      email: ownerEmail,
      password: 'Password123!',
      name: 'Service Owner',
      role: RoleType.OWNER,
      orgType: OrganizationType.BUSINESS,
    });
    businessOrgId = businessOrg.id;

    platformAdminSession = await loginAndGetCookie(adminEmail, 'Password123!');
    serviceOwnerSession = await loginAndGetCookie(ownerEmail, 'Password123!');
  });

  afterAll(async () => {
    await cleanupUserByEmail('platform-admin-tenant@test.com');
    await cleanupUserByEmail('service-owner-tenant@test.com');
    await app.close();
  });

  describe('Tenant Management Access', () => {
    it('GET /platform/tenant should allow Platform Admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/platform/tenant')
        .set('Cookie', platformAdminSession);

      expect(res.status).toBe(HttpStatus.OK);
      expect(Array.isArray(res.body.data)).toBe(true);
      // It should at least contain the business org we created
      expect((res.body.data as { id: string }[]).some((org) => org.id === businessOrgId)).toBe(true);
    });

    it('GET /platform/tenant should forbid Service Owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/platform/tenant')
        .set('Cookie', serviceOwnerSession);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('GET /platform/tenant/:id should allow Platform Admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/platform/tenant/${businessOrgId}`)
        .set('Cookie', platformAdminSession);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.id).toBe(businessOrgId);
      expect(res.body.data.name).toBe('Service Owner\'s Org');
    });

    it('PATCH /platform/tenant/:id should allow Platform Admin to activate tenant', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/platform/tenant/${businessOrgId}`)
        .set('Cookie', platformAdminSession)
        .send({
          isActive: true,
          name: 'Updated Business Org',
        });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.metadata.isActive).toBe(true);
      expect(res.body.data.name).toBe('Updated Business Org');
    });

    it('PATCH /platform/tenant/:id should forbid Service Owner', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/platform/tenant/${businessOrgId}`)
        .set('Cookie', serviceOwnerSession)
        .send({
          isActive: false,
        });

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
