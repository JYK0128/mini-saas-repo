import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

import { CoreEntity } from '../_common/core.entity';
import { AuditRepository } from './audit.repository';

@Entity({
  schema: 'platform',
  repository: () => AuditRepository,
})
export class Audit
  extends CoreEntity<Audit> {
  [EntityRepositoryType]?: AuditRepository;

  @Property({ type: 'string', nullable: true })
  @ApiProperty({ description: '유저 ID', nullable: true })
  userId?: string;

  @Property({ type: 'string', nullable: true })
  @ApiProperty({ description: '조직 ID', nullable: true })
  organizationId?: string;

  @Property({ type: 'text' })
  @ApiProperty({ description: '요청 URL' })
  url!: string;

  @Property({ type: 'string' })
  @ApiProperty({ description: '요청 메서드' })
  method!: string;

  @Property({ type: 'integer' })
  @ApiProperty({ description: '응답 상태 코드' })
  statusCode!: number;

  @Property({ type: 'integer' })
  @ApiProperty({ description: '수행 시간 (ms)' })
  duration!: number;

  @Property({ type: 'string', nullable: true })
  @ApiProperty({ description: 'IP 주소', nullable: true })
  ip?: string;

  @Property({ type: 'text', nullable: true })
  @ApiProperty({ description: 'User-Agent', nullable: true })
  userAgent?: string;

  @Property({ type: 'text', nullable: true })
  @ApiProperty({ description: '요청한 페이지 (Referer)', nullable: true })
  referer?: string;

  @Property({ type: 'json', nullable: true })
  @ApiProperty({ description: '페이로드 (마스킹됨)', nullable: true })
  payload?: unknown;

  @Property({ type: 'json', nullable: true })
  @ApiProperty({ description: '응답 데이터 (마스킹됨)', nullable: true })
  responseData?: unknown;

  @Property({ type: 'text', nullable: true })
  @ApiProperty({ description: '에러 메시지', nullable: true })
  error?: string;
}
