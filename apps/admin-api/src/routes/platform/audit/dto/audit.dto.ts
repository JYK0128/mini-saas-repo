import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Length } from 'class-validator';

import { Audit } from '@/entities';

export class AuditSearchDto {
  @ApiPropertyOptional({ description: '유저 ID로 검색' })
  @IsOptional()
  @Length(1)
  userId?: string;

  @ApiPropertyOptional({ description: '조직 ID로 검색' })
  @IsOptional()
  @Length(1)
  organizationId?: string;

  @ApiPropertyOptional({ description: 'URL로 검색' })
  @IsOptional()
  @Length(1)
  url?: string;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20 })
  @IsOptional()
  limit?: number = 20;
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
