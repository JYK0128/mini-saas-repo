import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { Organization, OrganizationType } from '@/entities';

import { ServicePlanResponseDto } from './dto/pricing.dto';

@Injectable()
export class PricingService {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<ServicePlanResponseDto[]> {
    const platformOrg = await this.em.findOne(Organization, {
      metadata: { type: OrganizationType.PLATFORM },
    });

    return (platformOrg?.metadata.pricingPlans as ServicePlanResponseDto[]) || [];
  }
}
