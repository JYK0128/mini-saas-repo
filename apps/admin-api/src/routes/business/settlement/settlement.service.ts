import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { Organization, OrganizationType } from '@/entities';

import { ServiceSettlementResponseDto } from './dto/settlement.dto';

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

  async findAll(organizationId: string): Promise<ServiceSettlementResponseDto[]> {
    const platformOrg = await this.em.findOne(Organization, {
      metadata: { type: OrganizationType.PLATFORM },
    });

    const allSettlements = (platformOrg?.metadata.settlements as SettlementRecord[]) || [];
    return allSettlements
      .filter((s) => s.organizationId === organizationId)
      .map((s) => ({
        id: s.id,
        amount: s.amount,
        status: s.status,
        settledAt: s.settledAt,
        createdAt: s.createdAt,
      }));
  }
}
