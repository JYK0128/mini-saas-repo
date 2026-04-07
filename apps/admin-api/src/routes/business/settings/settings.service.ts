import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorException } from '@/common/exceptions/error.exception';
import { OrganizationRepository } from '@/entities/organization/organization.repository';

import { ServiceSettingsResponseDto, UpdateServiceSettingsDto } from './dto/settings.dto';

interface ServiceSettings {
  displayName?: string
  logoUrl?: string
}

@Injectable()
export class SettingsService {
  constructor(private readonly organizationRepo: OrganizationRepository) { }

  async findOne(organizationId: string): Promise<ServiceSettingsResponseDto> {
    const org = await this.organizationRepo.findOne(organizationId);
    if (!org) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const settings = (org.metadata.settings as ServiceSettings) || {};

    return {
      displayName: settings.displayName || org.name,
      logoUrl: org.metadata.logoUrl,
      updatedAt: org.updatedAt,
    };
  }

  async update(organizationId: string, dto: UpdateServiceSettingsDto): Promise<ServiceSettingsResponseDto> {
    const org = await this.organizationRepo.findOne(organizationId);
    if (!org) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const { logoUrl, ...rest } = dto;

    if (logoUrl !== undefined) {
      org.metadata.logoUrl = logoUrl;
    }

    const currentSettings = (org.metadata.settings as ServiceSettings) || {};
    org.metadata.settings = {
      ...currentSettings,
      ...rest,
    };

    await this.organizationRepo.getEntityManager().flush();

    return this.findOne(organizationId);
  }
}
