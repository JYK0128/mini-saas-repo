import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { Organization, OrganizationType } from '@/entities';

import { CreateSettlementDto, SettlementResponseDto } from './dto/settlement.dto';

interface SettlementRecord {
  id: string
  organizationId: string
  organizationName: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  settledAt?: Date
  createdAt: Date
}

@Injectable()
export class SettlementService {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<SettlementResponseDto[]> {
    const platformOrg = await this.em.findOne(Organization, {
      metadata: { type: OrganizationType.PLATFORM },
    });

    return (platformOrg?.metadata.settlements as SettlementResponseDto[]) || [];
  }

  async create(dto: CreateSettlementDto): Promise<SettlementResponseDto> {
    const em = this.em.fork();
    const platformOrg = await em.findOne(Organization, {
      metadata: { type: OrganizationType.PLATFORM },
    });

    if (!platformOrg) {
      throw new Error('PLATFORM_ORG_NOT_FOUND');
    }

    const org = await em.findOne(Organization, { id: dto.organizationId });
    if (!org) {
      throw new Error('TARGET_ORG_NOT_FOUND');
    }

    const currentSettlements = (platformOrg.metadata.settlements as SettlementRecord[]) || [];
    const newSettlement: SettlementRecord = {
      id: `set-${Date.now()}`,
      organizationId: dto.organizationId,
      organizationName: org.name,
      amount: dto.amount,
      status: 'PENDING',
      createdAt: new Date(),
    };

    platformOrg.metadata.settlements = [...currentSettlements, newSettlement];
    return newSettlement;
  }
}
