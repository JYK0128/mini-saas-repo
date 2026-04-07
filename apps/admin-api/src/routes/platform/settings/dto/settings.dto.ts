import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, Length } from 'class-validator';

export class UpdatePlatformSettingsDto {
  @ApiProperty({ description: 'Maintenance mode status', example: false })
  @IsBoolean()
  @IsOptional()
  maintenanceMode?: boolean;

  @ApiProperty({ description: 'System notification message', example: 'Scheduled maintenance on Sunday' })
  @Length(1)
  @IsOptional()
  systemNotification?: string;

  @ApiProperty({ description: 'Allowed IP ranges for admin access', example: '127.0.0.1/32' })
  @Length(1)
  @IsOptional()
  allowedIpRanges?: string;
}

export class PlatformSettingsResponseDto {
  @ApiProperty()
  maintenanceMode!: boolean;

  @ApiProperty()
  systemNotification!: string;

  @ApiProperty()
  allowedIpRanges!: string;

  @ApiProperty()
  updatedAt!: Date;
}
