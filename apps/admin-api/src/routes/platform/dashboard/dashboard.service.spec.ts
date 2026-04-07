import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';

import { Member, Organization } from '@/entities';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const mockCount = jest.fn().mockResolvedValue(10);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: EntityManager,
          useValue: {
            count: mockCount,
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    mockCount.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getPlatformStats should return stats', async () => {
    const stats = await service.getPlatformStats();
    expect(stats).toHaveProperty('activeTenants', 10);
    expect(mockCount).toHaveBeenCalledWith(Organization, expect.any(Object));
  });

  it('getServiceStats should return stats', async () => {
    const stats = await service.getServiceStats('org-id');
    expect(stats).toHaveProperty('totalSales');
    expect(mockCount).toHaveBeenCalledWith(Member, { organization: { id: 'org-id' } });
  });
});
