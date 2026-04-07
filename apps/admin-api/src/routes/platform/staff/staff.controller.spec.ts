/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable sonarjs/no-hardcoded-passwords */
import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Account, Invitation, Member, Organization, OrganizationMetadata, OrganizationType, ProviderType, RoleType, Session, User, Verification } from '@/entities';

describe('StaffController (E2E)', () => {
  let app: INestApplication;
  let orm: MikroORM;

  // Sessions
  let systemOwnerSession: string;
  let businessOwnerSession: string;
  let businessAdminSession: string;
  let businessOrgId: string;

  // IDs
  let businessAdminMemberId: string;

  interface StaffMember {
    id: string
    user: {
      id: string
      email: string
      name: string
    }
    role: RoleType
    organization: {
      id: string
      name: string
    }
  }

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
    organization, // Optional: reuse existing org
  }: {
    email: string
    password: string
    name: string
    role: RoleType
    orgType: OrganizationType
    organization?: Organization
  }): Promise<{ user: User, organization: Organization, member: Member }> => {
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

      const targetOrg = organization
        ? await em.findOneOrFail(Organization, organization.id)
        : em.create(Organization, {
          name: `${name}'s Org`,
          metadata: new OrganizationMetadata(orgType),
        });
      if (!organization) em.persist(targetOrg);

      const member = em.create(Member, {
        user,
        organization: targetOrg,
        role,
      });
      em.persist(member);

      await em.flush();
      return { user, organization: targetOrg, member };
    });
  };

  const cleanupUserByEmail = async (email: string) => {
    await withRequestContext(async (em) => {
      const user = await em.findOne(User, { email }, { populate: ['member.organization'] as const });
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

    orm = app.get(MikroORM);
    await app.init();

    const sysOwnerEmail = 'sys-owner-staff@test.com';
    const bizOwnerEmail = 'biz-owner-staff@test.com';
    const bizAdminEmail = 'biz-admin-staff@test.com';

    await cleanupUserByEmail(sysOwnerEmail);
    await cleanupUserByEmail(bizOwnerEmail);
    await cleanupUserByEmail(bizAdminEmail);

    // 1. System Owner
    await createTestUser({
      email: sysOwnerEmail,
      password: 'Password123!',
      name: 'System Owner',
      role: RoleType.OWNER,
      orgType: OrganizationType.PLATFORM,
    });

    // 2. Business Owner (new org)
    const { organization: bizOrg } = await createTestUser({
      email: bizOwnerEmail,
      password: 'Password123!',
      name: 'Business Owner',
      role: RoleType.OWNER,
      orgType: OrganizationType.BUSINESS,
    });
    businessOrgId = bizOrg.id;
    // businessOrgId = bizOrg.id;

    // 3. Business Admin (same biz org)
    const { member: bizAdminMember } = await createTestUser({
      email: bizAdminEmail,
      password: 'Password123!',
      name: 'Business Admin',
      role: RoleType.ADMIN,
      orgType: OrganizationType.BUSINESS,
      organization: bizOrg,
    });
    businessAdminMemberId = bizAdminMember.id;

    systemOwnerSession = await loginAndGetCookie(sysOwnerEmail, 'Password123!');
    businessOwnerSession = await loginAndGetCookie(bizOwnerEmail, 'Password123!');
    businessAdminSession = await loginAndGetCookie(bizAdminEmail, 'Password123!');
  });

  afterAll(async () => {
    await cleanupUserByEmail('sys-owner-staff@test.com');
    await cleanupUserByEmail('biz-owner-staff@test.com');
    await cleanupUserByEmail('biz-admin-staff@test.com');
    await app.close();
  });

  describe('Restructured Staff Access', () => {
    it('GET /platform/staff should return system members for System Owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/platform/staff')
        .set('Cookie', systemOwnerSession);

      expect(res.status).toBe(HttpStatus.OK);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect((res.body.data as StaffMember[]).some((m: StaffMember) => m.user.email === 'sys-owner-staff@test.com')).toBe(true);
      expect((res.body.data as StaffMember[]).some((m: StaffMember) => m.user.email === 'biz-owner-staff@test.com')).toBe(false);
    });

    it('GET /service/staff should return business members for Business Owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/staff')
        .set('Cookie', businessOwnerSession);

      expect(res.status).toBe(HttpStatus.OK);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect((res.body.data as StaffMember[]).some((m: StaffMember) => m.user.email === 'biz-owner-staff@test.com')).toBe(true);
      expect((res.body.data as StaffMember[]).some((m: StaffMember) => m.user.email === 'biz-admin-staff@test.com')).toBe(true);
      expect((res.body.data as StaffMember[]).some((m: StaffMember) => m.user.email === 'sys-owner-staff@test.com')).toBe(false);
    });

    it('GET /service/staff should be allowed for Business Admin (Read-only)', async () => {
      const res = await request(app.getHttpServer())
        .get('/service/staff')
        .set('Cookie', businessAdminSession);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('POST /service/staff should be forbidden for Business Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/service/staff')
        .set('Cookie', businessAdminSession)
        .send({
          email: 'new-staff@test.com',
          name: 'New Staff',
          role: RoleType.MEMBER,
        });

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('POST /service/staff should be allowed for Business Owner', async () => {
      const res = await request(app.getHttpServer())
        .post('/service/staff')
        .set('Cookie', businessOwnerSession)
        .send({
          email: 'new-staff@test.com',
          name: 'New Staff',
          role: RoleType.MEMBER,
        });

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body.data.email).toBe('new-staff@test.com');
    });

    it('DELETE /service/staff/:id should prevent removing the last owner', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/service/staff')
        .set('Cookie', businessOwnerSession);

      const ownerMember = (listRes.body.data as StaffMember[])?.find((m: StaffMember) => m.user.email === 'biz-owner-staff@test.com');
      if (!ownerMember) {
        throw new Error('Owner member not found');
      }
      const ownerMemberId = ownerMember.id;

      const res = await request(app.getHttpServer())
        .delete(`/service/staff/${ownerMemberId}`)
        .set('Cookie', businessOwnerSession);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.error.code).toBe('LAST_OWNER_CANNOT_BE_REMOVED');
    });

    it('DELETE /service/staff/:id should allow removing a non-owner staff', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/service/staff/${businessAdminMemberId}`)
        .set('Cookie', businessOwnerSession);

      expect(res.status).toBe(HttpStatus.OK);
    });

    it('DELETE /service/staff/:id should allow self-removal when another owner exists', async () => {
      const owner2Email = 'biz-owner2-staff@test.com';
      await cleanupUserByEmail(owner2Email);
      await createTestUser({
        email: owner2Email,
        password: 'Password123!',
        name: 'Business Owner 2',
        role: RoleType.OWNER,
        orgType: OrganizationType.BUSINESS,
        organization: { id: businessOrgId } as Organization,
      });
      const owner2Session = await loginAndGetCookie(owner2Email, 'Password123!');

      const listRes = await request(app.getHttpServer())
        .get('/service/staff')
        .set('Cookie', owner2Session);

      const selfMember = (listRes.body.data as StaffMember[])?.find((m: StaffMember) => m.user.email === owner2Email);
      if (!selfMember) {
        throw new Error('Self owner member not found');
      }

      const res = await request(app.getHttpServer())
        .delete(`/service/staff/${selfMember.id}`)
        .set('Cookie', owner2Session);

      expect(res.status).toBe(HttpStatus.OK);
      await cleanupUserByEmail(owner2Email);
    });

    it('DELETE /service/staff/:id should cancel invitation and invalidate token', async () => {
      const inviteEmail = 'cancel-invite-staff@test.com';

      const inviteRes = await request(app.getHttpServer())
        .post('/service/staff')
        .set('Cookie', businessOwnerSession)
        .send({
          email: inviteEmail,
          name: 'Cancel Invite Staff',
          role: RoleType.MEMBER,
        });

      expect(inviteRes.status).toBe(HttpStatus.CREATED);

      const token = await withRequestContext(async (em) => {
        const verification = await em.findOne(Verification, {
          identifier: inviteEmail,
          expiresAt: { $gt: new Date() },
        }, {
          orderBy: { createdAt: 'DESC' },
        });

        if (!verification) {
          throw new Error('Invitation token not found');
        }

        return verification.value;
      });

      const listRes = await request(app.getHttpServer())
        .get('/service/staff')
        .set('Cookie', businessOwnerSession);
      const pendingInvite = (listRes.body.data as StaffMember[])?.find((m: StaffMember) => m.user.email === inviteEmail);
      if (!pendingInvite) {
        throw new Error('Pending invitation not found');
      }

      const cancelRes = await request(app.getHttpServer())
        .delete(`/service/staff/${pendingInvite.id}`)
        .set('Cookie', businessOwnerSession);
      expect(cancelRes.status).toBe(HttpStatus.OK);

      const getInviteRes = await request(app.getHttpServer())
        .get(`/service/staff/invite/${token}`);

      expect(getInviteRes.status).toBe(HttpStatus.BAD_REQUEST);
      expect(getInviteRes.body.error.code).toBe('INVALID_OR_EXPIRED_INVITATION');

      await withRequestContext(async (em) => {
        await em.nativeDelete(Invitation, { email: inviteEmail });
        await em.nativeDelete(Verification, { identifier: inviteEmail });
      });
    });
  });
});
