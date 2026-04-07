import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';

import { TenantService } from './tenant.service';

describe('TenantService (DB)', () => {
  let service: TenantService;
  let orm: MikroORM;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<TenantService>(TenantService);
    orm = module.get<MikroORM>(MikroORM);
  });

  afterAll(async () => {
    await orm.close();
  });

  const withRequestContext = (callback: () => Promise<unknown>) => {
    const em = orm.em.fork();
    return RequestContext.create(em, callback);
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return tenants', async () => {
    await withRequestContext(async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
