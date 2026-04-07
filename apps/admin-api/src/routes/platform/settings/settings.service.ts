import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorException } from '@/common/exceptions/error.exception';
import { OrganizationType } from '@/entities';
import { OrganizationRepository } from '@/entities/organization/organization.repository';

import { PlatformSettingsResponseDto, UpdatePlatformSettingsDto } from './dto/settings.dto';

interface PlatformSettings {
  maintenanceMode?: boolean
  systemNotification?: string
  allowedIpRanges?: string
}

@Injectable()
export class SettingsService {
  constructor(private readonly organizationRepo: OrganizationRepository) { }

  private async getPlatformOrg() {
    const platformOrg = await this.organizationRepo.findOne({
      metadata: { type: OrganizationType.PLATFORM },
    });

    if (!platformOrg) {
      throw new ErrorException('PLATFORM_ORG_NOT_FOUND', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return platformOrg;
  }

  async findOne(): Promise<PlatformSettingsResponseDto> {
    const platformOrg = await this.getPlatformOrg();
    const settings = (platformOrg.metadata.settings as PlatformSettings) || {};

    return {
      maintenanceMode: !!settings.maintenanceMode,
      systemNotification: settings.systemNotification || '',
      allowedIpRanges: settings.allowedIpRanges || '0.0.0.0/0',
      updatedAt: platformOrg.updatedAt,
    };
  }

  async update(dto: UpdatePlatformSettingsDto): Promise<PlatformSettingsResponseDto> {
    const platformOrg = await this.getPlatformOrg();

    const currentSettings = (platformOrg.metadata.settings as PlatformSettings) || {};
    platformOrg.metadata.settings = {
      ...currentSettings,
      ...dto,
    };

    return this.findOne();
  }
}
