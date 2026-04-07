import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Organization } from '@/entities';

import { DashboardService } from '../dashboard/dashboard.service';
import { PlatformPolicyResponseDto, PlatformStatusResponseDto } from './dto/platform.dto';

@Injectable()
export class PlatformService {
  constructor(
    private readonly em: EntityManager,
    private readonly dashboardService: DashboardService,
  ) {}

  async getStatus(organizationId: string): Promise<PlatformStatusResponseDto> {
    const org = await this.em.findOne(Organization, { id: organizationId });
    if (!org) {
      throw new NotFoundException('ORGANIZATION_NOT_FOUND');
    }

    const usage = this.dashboardService.getPlatformUsageData();

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      isActive: org.metadata.isActive,
      trialExpiresAt: org.metadata.trialExpiresAt,
      activationExpiresAt: org.metadata.activationExpiresAt,
      usage: {
        apiCalls: usage.apiCalls,
        storageUsed: usage.storageUsed,
        lastCalculatedAt: usage.lastCalculatedAt,
      },
    };
  }

  async getPolicy(_organizationId: string): Promise<PlatformPolicyResponseDto> {
    // Currently returns static policy info (could be linked to platform settings later)
    await Promise.resolve();

    return {
      apiLimit: 100000,
      storageLimit: 1024, // 1GB
      features: ['DASHBOARD', 'STAFF_MANAGEMENT', 'AUDIT_LOG', 'TENANT_MANAGEMENT'],
      planName: 'Standard Business Plan',
    };
  }
}
