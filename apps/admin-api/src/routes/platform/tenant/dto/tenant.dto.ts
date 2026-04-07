import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsISO8601, IsNumber, IsOptional, Length } from 'class-validator';

import { OrganizationType } from '@/entities';

export class TenantMetadataResponseDto {
  @ApiProperty({ enum: OrganizationType })
  type!: OrganizationType;

  @ApiPropertyOptional()
  trialExpiresAt?: Date;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional()
  activatedAt?: Date;

  @ApiPropertyOptional()
  activationExpiresAt?: Date;
}

export class TenantResponseDto {
  @Length(1)
  id!: string;

  @Length(1)
  name!: string;

  @Length(1)
  slug!: string;

  @ApiProperty({ type: TenantMetadataResponseDto })
  metadata!: TenantMetadataResponseDto;

  @IsNumber()
  memberCount!: number;

  @IsISO8601()
  createdAt!: Date;
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Length(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  trialExpiresAt?: Date;
}
