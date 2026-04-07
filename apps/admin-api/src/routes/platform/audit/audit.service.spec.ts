import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { OrganizationType } from '@/entities';

import { AuditService } from './audit.service';

describe('AuditService (DB)', () => {
  let service: AuditService;
  let orm: MikroORM;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<AuditService>(AuditService);
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

  it('findAll should return audit logs', async () => {
    await withRequestContext(async () => {
      const result = await service.findAll({}, { id: 'test-org', type: OrganizationType.PLATFORM });
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });
});
