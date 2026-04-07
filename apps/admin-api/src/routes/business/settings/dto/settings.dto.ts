import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class ServiceSettingsResponseDto {
  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiProperty()
  updatedAt!: Date;
}

export class UpdateServiceSettingsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  logoUrl?: string;
}

export class LogoUploadResponseDto {
  @ApiProperty()
  @IsUrl()
  logoUrl!: string;
}
