import path from 'node:path';

import { HttpStatus, Injectable } from '@nestjs/common';
import fs from 'fs/promises';

import { ErrorException } from '@/common/exceptions/error.exception';
import type { Organization } from '@/entities';
import { OrganizationRepository } from '@/entities/organization/organization.repository';

import { ServiceSettingsResponseDto, UpdateServiceSettingsDto } from './dto/settings.dto';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const LOGO_IMAGE_PREFIX = '/uploads/logo/';

@Injectable()
export class SettingsService {
  constructor(private readonly organizationRepo: OrganizationRepository) { }

  async updateOrganization(organization: Organization, dto: UpdateServiceSettingsDto): Promise<ServiceSettingsResponseDto> {
    organization.metadata.displayname = dto.displayName;
    return Promise.resolve(organization);
  }

  /**
     * 파일 디스크 삭제
     */
  private async removeUploadedFile(
    filePath: string,
  ) {
    try {
      await fs.unlink(filePath);
    }
    catch {
      throw new ErrorException('FILE_NOT_DELETED', HttpStatus.CONFLICT);
    }
  }

  /**
     * 프로파일 업로드
     */
  async uploadLogoImage(
    organization: Organization,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new ErrorException('FILE_REQUIRED', HttpStatus.BAD_REQUEST);
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    if (
      !ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)
      || !ALLOWED_IMAGE_EXTENSIONS.has(fileExt)
    ) {
      await this.removeUploadedFile(file.path);
      throw new ErrorException('INVALID_IMAGE_TYPE', HttpStatus.BAD_REQUEST);
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      await this.removeUploadedFile(file.path);
      throw new ErrorException('FILE_TOO_LARGE', HttpStatus.PAYLOAD_TOO_LARGE);
    }

    const previousImage = organization.metadata.logoUrl;
    if (previousImage && previousImage.startsWith(LOGO_IMAGE_PREFIX)) {
      const fileName = previousImage.replace(LOGO_IMAGE_PREFIX, '');
      const filePath = path.join(process.cwd(), 'uploads', 'logo', fileName);
      await this.removeUploadedFile(filePath).catch(() => {});
    }

    const imgPath = `${LOGO_IMAGE_PREFIX}${file.filename}`;
    organization.metadata.logoUrl = imgPath;
  }
}
