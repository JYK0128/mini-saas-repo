import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { Organization } from '@/entities';

import { SettingsService } from './settings.service';

describe('Service SettingsService (DB)', () => {
  let service: SettingsService;
  let orm: MikroORM;
  let em: EntityManager;
  let appModule: TestingModule;

  const withRequestContext = <T>(callback: () => Promise<T>) =>
    RequestContext.create(em, callback);

  beforeAll(async () => {
    appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = appModule.get<SettingsService>(SettingsService);
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

  describe('Organization Settings', () => {
    let organization: Organization;

    beforeEach(async () => {
      await withRequestContext(async () => {
        const currentEm = RequestContext.getEntityManager()!;
        await currentEm.nativeDelete(Organization, { name: 'Settings Test Org' });

        organization = currentEm.create(Organization, {
          name: 'Settings Test Org',
        });
        currentEm.persist(organization);
        await currentEm.flush();
      });
    });

    it('update should update settings', async () => {
      await withRequestContext(async () => {
        const result = await service.updateOrganization(organization, {
          displayName: 'Updated Name',
        });
        expect(result.displayName).toBe('Updated Name');
      });
    });
  });
});
