import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Length } from 'class-validator';

import { Audit } from '@/entities';

export class AuditSearchDto {
  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @Length(1)
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @Length(1)
  @IsOptional()
  organizationId?: string;

  @ApiProperty({ required: false })
  @Length(1)
  @IsOptional()
  url?: string;
}

export class AuditListItemDto extends Audit {
  @ApiPropertyOptional({ description: '유저 이름' })
  userName?: string;

  @ApiPropertyOptional({ description: '조직 이름' })
  organizationName?: string;
}

export class AuditListResponseDto {
  @ApiProperty({ type: () => [AuditListItemDto] })
  items!: AuditListItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
