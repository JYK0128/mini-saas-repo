import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorException } from '@/common/exceptions/error.exception';
import { AuditRepository, type User } from '@/entities';

import { AuditSearchDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepo: AuditRepository) {}

  async findAll(
    user: User,
    {
      page = 1,
      limit = 20,
      userId,
      url,
    }: AuditSearchDto,
  ) {
    const organizationId = user.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const offset = (page - 1) * limit;
    const [items, total] = await this.auditRepo.findAndCount({
      organizationId,
      userId,
      url: url ? { $ilike: `%${url}%` } : undefined,
    }, {
      limit,
      offset,
      orderBy: { createdAt: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
