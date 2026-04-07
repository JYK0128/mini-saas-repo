import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { Member } from '@/entities';

import { PlatformUsageDto, ServiceStatsDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly em: EntityManager) {}

  async getServiceStats(organizationId: string): Promise<ServiceStatsDto> {
    const activeStaff = await this.em.count(Member, {
      organization: { id: organizationId },
    });

    return {
      totalSales: 4500000,
      activeStaff,
      platformUsage: 78,
      currentPlan: 'Premium',
    };
  }

  getPlatformUsageData(): PlatformUsageDto {
    return {
      apiCalls: 12500,
      storageUsed: 45,
      lastCalculatedAt: new Date(),
    };
  }
}
