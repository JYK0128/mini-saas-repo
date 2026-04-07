import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsString } from 'class-validator';

import { TermType } from '@/entities/term-category/term-category.entity';

export class SignInNewAgreementResponseDto {
  @ApiProperty({ type: 'integer', description: '약관 ID' })
  id!: number;

  @ApiProperty({ description: '약관 내용' })
  content!: string;

  @ApiProperty({ description: '약관 버전' })
  version!: string;

  @ApiProperty({ enum: TermType, description: '약관 유형 (필수/선택)' })
  termType!: TermType;

  @ApiProperty({ description: '약관 제목' })
  title!: string;

  @ApiProperty({ type: 'string', format: 'date-time', description: '약관 시작일' })
  startDate!: Date;

  @ApiProperty({ type: 'string', format: 'date-time', description: '약관 종료일' })
  endDate!: Date;

  @ApiProperty({ type: 'integer', description: '동합 동의 ID (미동의 시 null)', required: false, nullable: true })
  agreementId?: number | null;

  @ApiProperty({ type: 'string', format: 'date-time', description: '동의 일시 (미동의 시 null)', required: false, nullable: true })
  agreedAt?: Date | null;
}

export class SetNewAgreementsDto {
  @IsString({ each: true })
  @ArrayNotEmpty()
  termIds!: string[];
}
