import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { Organization, OrganizationType } from '@/entities';

import { CreatePlanDto, PlanResponseDto } from './dto/pricing.dto';

@Injectable()
export class PricingService {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<PlanResponseDto[]> {
    const platformOrg = await this.em.findOne(Organization, {
      metadata: { type: OrganizationType.PLATFORM },
    });

    const plans = (platformOrg?.metadata.pricingPlans as CreatePlanDto[]) || [];
    return plans.map((p, index) => ({
      id: `plan-${index}`,
      ...p,
      createdAt: new Date(),
    }));
  }

  async create(dto: CreatePlanDto): Promise<PlanResponseDto> {
    const em = this.em.fork();
    const platformOrg = await em.findOne(Organization, {
      metadata: { type: OrganizationType.PLATFORM },
    });

    if (!platformOrg) {
      throw new Error('PLATFORM_ORG_NOT_FOUND');
    }

    const currentPlans = (platformOrg.metadata.pricingPlans as CreatePlanDto[]) || [];
    const newPlan = { ...dto, createdAt: new Date() };
    platformOrg.metadata.pricingPlans = [...currentPlans, newPlan];

    await em.flush();
    return { id: `plan-${currentPlans.length}`, ...newPlan };
  }
}
