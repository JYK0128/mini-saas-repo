import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';

import { PricingService } from './pricing.service';

describe('PricingService (DB)', () => {
  let service: PricingService;
  let orm: MikroORM;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<PricingService>(PricingService);
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

  it('findAll should return plans', async () => {
    await withRequestContext(async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  it('create should add a plan', async () => {
    await withRequestContext(async () => {
      const dto = { name: 'Test Plan', monthlyPrice: 10000, features: ['F1'] };
      const plan = await service.create(dto);
      expect(plan.name).toBe('Test Plan');
    });
  });
});
