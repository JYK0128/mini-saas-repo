import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';

import { DashboardService } from './dashboard.service';

describe('Service DashboardService (DB)', () => {
  let service: DashboardService;
  let orm: MikroORM;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
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

  it('getServiceStats should return stats', async () => {
    await withRequestContext(async () => {
      const result = await service.getServiceStats('some-org-id');
      expect(result).toHaveProperty('activeStaff');
    });
  });
});
