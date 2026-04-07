import { Injectable } from '@nestjs/common';

import { AuditRepository, OrganizationType } from '@/entities';

import { AuditSearchDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepo: AuditRepository) {}

  async findAll(
    dto: AuditSearchDto,
    orgContext: { id: string, type: OrganizationType },
  ) {
    const { page = 1, limit = 20, userId, organizationId, url } = dto;
    const offset = (page - 1) * limit;

    const targetOrgId = orgContext.type === OrganizationType.BUSINESS ? orgContext.id : organizationId;

    const items = await this.auditRepo.searchAudits({
      limit,
      offset,
      organizationId: targetOrgId,
      userId,
      url,
    });

    const total = await this.auditRepo.count({
      organizationId: targetOrgId || undefined,
      userId: userId || undefined,
      url: url ? { $ilike: `%${url}%` } : undefined,
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
