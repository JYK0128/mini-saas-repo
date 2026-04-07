import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorException } from '@/common/exceptions/error.exception';
import { OrganizationType } from '@/entities';
import { OrganizationRepository } from '@/entities/organization/organization.repository';

import { UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
  ) {}

  async findAll() {
    const tenants = await this.organizationRepo.find(
      { metadata: { type: OrganizationType.BUSINESS } },
      { populate: ['members'] },
    );

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      metadata: t.metadata,
      memberCount: t.members.length,
      createdAt: t.createdAt,
    }));
  }

  async findOne(id: string) {
    const tenant = await this.organizationRepo.findOne(
      { id, metadata: { type: OrganizationType.BUSINESS } },
      { populate: ['members', 'members.user'] },
    );

    if (!tenant) {
      throw new ErrorException('TENANT_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.organizationRepo.findOne({
      id,
      metadata: { type: OrganizationType.BUSINESS },
    });

    if (!tenant) {
      throw new ErrorException('TENANT_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (dto.name) {
      tenant.name = dto.name;
    }

    if (dto.isActive !== undefined) {
      tenant.metadata.isActive = dto.isActive;
      if (dto.isActive && !tenant.metadata.activatedAt) {
        tenant.metadata.activatedAt = new Date();
      }
    }

    if (dto.trialExpiresAt) {
      tenant.metadata.trialExpiresAt = new Date(dto.trialExpiresAt);
    }

    return tenant;
  }
}
