import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { Organization, OrganizationMetadata, OrganizationType } from '@/entities';

import { SettingsService } from './settings.service';

describe('SettingsService (DB)', () => {
  let service: SettingsService;
  let orm: MikroORM;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
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

  it('findOne should return platform settings', async () => {
    await withRequestContext(async () => {
      // Ensure platform org exists
      const em = orm.em.fork();
      let platformOrg = await em.findOne(Organization, { metadata: { type: OrganizationType.PLATFORM } });
      if (!platformOrg) {
        platformOrg = em.create(Organization, {
          name: 'Platform Parent',
          metadata: new OrganizationMetadata(OrganizationType.PLATFORM),
        });
        em.persist(platformOrg);
        await em.flush();
      }

      const settings = await service.findOne();
      expect(settings).toHaveProperty('maintenanceMode');
    });
  });

  it('update should change settings', async () => {
    await withRequestContext(async () => {
      const dto = { maintenanceMode: true, systemNotification: 'Test maintenance' };
      const updated = await service.update(dto);
      expect(updated.maintenanceMode).toBe(true);
      expect(updated.systemNotification).toBe('Test maintenance');
    });
  });
});
