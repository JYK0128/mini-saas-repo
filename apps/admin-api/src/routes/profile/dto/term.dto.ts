import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

import { Term, TermAgreement, TermCategory } from '@/entities';

export class TermAgreementResponseDto
  extends IntersectionType(
    Term,
    PickType(TermCategory, ['isActive', 'termType', 'title', 'organization']),
    PickType(TermAgreement, ['agreedAt']),
  ) {
  @ApiProperty({ type: String, required: false })
  agreementId?: string;
}

export class TermAgreementDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  termIds!: string[];
}

export class TermWithdrawalDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  agreementId!: string;
}
