import { EntityManager, RequestContext } from '@mikro-orm/postgresql';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { ErrorException } from '@/common/exceptions/error.exception';
import { Audit, Member, Organization, RoleType, User } from '@/entities';

import { AuditService } from './audit.service';

describe('BusinessAuditService (DB)', () => {
  let em: EntityManager;
  let app: TestingModule;
  let service: AuditService;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) =>
    RequestContext.create(em, () => callback(em));

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = app.get<AuditService>(AuditService);
    em = app.get<EntityManager>(EntityManager);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Audit listing with Database', () => {
    let testUserId: string;
    let testBusinessOrgId: string;

    beforeAll(async () => {
      await withRequestContext(async (forkedEm) => {
        // Clean start: remove any leftovers from previous failed runs
        const existingUsers = await forkedEm.find(User, {
          email: { $like: 'audit-test-%' },
        });
        const userIds = existingUsers.map((u) => u.id);

        if (userIds.length > 0) {
          await forkedEm.nativeDelete(Audit, { userId: { $in: [...userIds, 'other-user'] } });
          await forkedEm.nativeDelete(Member, { user: { $in: userIds } });
          await forkedEm.nativeDelete(User, { id: { $in: userIds } });
        }

        const orgs = await forkedEm.find(Organization, { name: { $like: 'Audit Test Org%' } });
        const orgIds = orgs.map((o) => o.id);
        if (orgIds.length > 0) {
          await forkedEm.nativeDelete(Audit, { organizationId: { $in: orgIds } });
          await forkedEm.nativeDelete(Member, { organization: { $in: orgIds } });
          await forkedEm.nativeDelete(Organization, { id: { $in: orgIds } });
        }

        await forkedEm.flush();
      });
    });

    beforeEach(async () => {
      await withRequestContext(async (forkedEm) => {
        const org = forkedEm.create(Organization, {
          name: `Audit Test Org ${Date.now()}`,
        });

        const user = forkedEm.create(User, {
          name: 'Audit Test User',
          email: `audit-test-${Date.now()}@example.com`,
          emailVerified: true,
        });

        const member = forkedEm.create(Member, {
          organization: org,
          user,
          role: RoleType.OWNER,
        });
        user.member = member;

        forkedEm.persist([org, user]);
        await forkedEm.flush();
        testUserId = user.id;
        testBusinessOrgId = org.id;
      });
    });

    afterEach(async () => {
      await withRequestContext(async (forkedEm) => {
        const users = await forkedEm.find(User, {
          email: { $like: 'audit-test-%' },
        });
        const userIds = users.map((u) => u.id);

        if (userIds.length > 0) {
          await forkedEm.nativeDelete(Audit, { userId: { $in: [...userIds, 'other-user'] } });
          await forkedEm.nativeDelete(Member, { user: { $in: userIds } });
          await forkedEm.nativeDelete(User, { id: { $in: userIds } });
        }

        const orgs = await forkedEm.find(Organization, { name: { $like: 'Audit Test Org%' } });
        const orgIds = orgs.map((o) => o.id);
        if (orgIds.length > 0) {
          await forkedEm.nativeDelete(Audit, { organizationId: { $in: orgIds } });
          await forkedEm.nativeDelete(Member, { organization: { $in: orgIds } });
          await forkedEm.nativeDelete(Organization, { id: { $in: orgIds } });
        }
        await forkedEm.flush();
      });
    });

    it('should throw ORGANIZATION_NOT_FOUND when user has no member', async () => {
      const user = new User();
      user.name = 'No Member User';
      user.email = 'no-member@example.com';

      await expect(service.findAll(user, {})).rejects.toThrow(
        new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND),
      );
    });

    it('should return audits for the user organization', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId, { populate: ['member.organization'] });

        // Seed some audits
        const audit1 = forkedEm.create(Audit, {
          organizationId: testBusinessOrgId,
          userId: user.id,
          url: '/test/api/v1',
          method: 'GET',
          statusCode: 200,
          duration: 100,
        });

        const audit2 = forkedEm.create(Audit, {
          organizationId: testBusinessOrgId,
          userId: 'other-user',
          url: '/test/api/v2',
          method: 'POST',
          statusCode: 201,
          duration: 200,
        });

        // Other organization audit (should not be returned)
        const otherOrg = forkedEm.create(Organization, { name: 'Other Org' });
        forkedEm.create(Audit, {
          organizationId: otherOrg.id,
          userId: user.id,
          url: '/other-api',
          method: 'GET',
          statusCode: 200,
          duration: 50,
        });

        await forkedEm.persist([audit1, audit2, otherOrg]).flush();

        const result = await service.findAll(user, { page: 1, limit: 10 });
        expect(result.items.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.items.some((i) => i.url === '/test/api/v1')).toBe(true);
        expect(result.items.some((i) => i.url === '/test/api/v2')).toBe(true);
      });
    });

    it('should filter audits by userId and url', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId, { populate: ['member.organization'] });

        forkedEm.create(Audit, {
          organizationId: testBusinessOrgId,
          userId: user.id,
          url: '/target/api',
          method: 'GET',
          statusCode: 200,
          duration: 100,
        });

        forkedEm.create(Audit, {
          organizationId: testBusinessOrgId,
          userId: 'other-user',
          url: '/other/api',
          method: 'GET',
          statusCode: 200,
          duration: 100,
        });

        await forkedEm.flush();

        // Filter by userId
        const userIdResult = await service.findAll(user, { userId: user.id });
        expect(userIdResult.items.length).toBe(1);
        expect(userIdResult.items[0].url).toBe('/target/api');

        // Filter by url
        const urlResult = await service.findAll(user, { url: 'target' });
        expect(urlResult.items.length).toBe(1);
        expect(urlResult.items[0].userId).toBe(user.id);
      });
    });
  });
});
