import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { Organization } from '@/entities';

import { PlatformService } from './platform.service';

describe('Service PlatformService (DB)', () => {
  let service: PlatformService;
  let orm: MikroORM;
  let em: EntityManager;
  let appModule: TestingModule;

  const withRequestContext = <T>(callback: () => Promise<T>) =>
    RequestContext.create(em, callback);

  beforeAll(async () => {
    appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = appModule.get<PlatformService>(PlatformService);
    orm = appModule.get<MikroORM>(MikroORM);
    em = appModule.get<EntityManager>(EntityManager);
  });

  afterAll(async () => {
    await orm.close();
    await appModule.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Organization based features', () => {
    let organization: Organization;

    beforeEach(async () => {
      await withRequestContext(async () => {
        const currentEm = RequestContext.getEntityManager()!;
        await currentEm.nativeDelete(Organization, { name: 'Platform Test Org' });

        organization = currentEm.create(Organization, {
          name: 'Platform Test Org',
        });
        currentEm.persist(organization);
        await currentEm.flush();
      });
    });

    it('getStatus should return platform status', async () => {
      await withRequestContext(async () => {
        const result = await service.getStatus(organization.id);
        expect(result).toHaveProperty('usage');
        expect(result.id).toBe(organization.id);
      });
    });

    it('getPolicy should return policy info', async () => {
      await withRequestContext(async () => {
        const result = await service.getPolicy(organization.id);
        expect(result).toHaveProperty('apiLimit');
        expect(result).toHaveProperty('planName');
      });
    });
  });
});
