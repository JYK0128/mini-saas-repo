import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { Member, Organization, OrganizationType } from '@/entities';

import { PlatformStatsDto, ServiceStatsDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly em: EntityManager) {}

  async getPlatformStats(): Promise<PlatformStatsDto> {
    const activeTenants = await this.em.count(Organization, {
      metadata: { type: OrganizationType.BUSINESS, isActive: true },
    });

    return {
      activeTenants,
      totalRevenue: 154000000,
      systemHealth: 'Healthy',
      pendingSettlements: 12,
    };
  }

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

  async getPlatformUsageData() {
    // Platform usage data retrieval to be implemented
    await Promise.resolve(true);

    return {
      apiCalls: 12500,
      storageUsed: 45,
      lastCalculatedAt: new Date(),
    };
  }
}
