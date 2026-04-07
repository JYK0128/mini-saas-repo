import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { Organization, OrganizationMetadata, OrganizationType, RoleType } from '@/entities';

import { StaffService } from './staff.service';

describe('StaffService (DB)', () => {
  let service: StaffService;
  let orm: MikroORM;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<StaffService>(StaffService);
    orm = module.get<MikroORM>(MikroORM);
  });

  afterAll(async () => {
    await orm.close();
  });

  const withRequestContext = (callback: () => Promise<void>) => {
    const em = orm.em.fork();
    return RequestContext.create(em, callback);
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return members of an organization', async () => {
    await withRequestContext(async () => {
      const em = orm.em.fork();
      let platformOrg = await em.findOne(Organization, { metadata: { type: OrganizationType.PLATFORM } });
      if (!platformOrg) {
        platformOrg = em.create(Organization, {
          name: 'Platform Staff Test Org',
          metadata: new OrganizationMetadata(OrganizationType.PLATFORM),
        });
        em.persist(platformOrg);
        await em.flush();
      }

      const result = await service.findAll(platformOrg.id);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  it('invite should create a member', async () => {
    await withRequestContext(async () => {
      const em = orm.em.fork();
      const platformOrg = await em.findOne(Organization, { metadata: { type: OrganizationType.PLATFORM } });
      if (!platformOrg) return;

      const email = `test-staff-${Date.now()}@test.com`;
      const dto = { email, name: 'Test Staff', role: RoleType.ADMIN };
      const member = await service.invite(platformOrg.id, dto);

      expect(member.user.email).toBe(email);
      expect(member.role).toBe(RoleType.ADMIN);
    });
  });
});
