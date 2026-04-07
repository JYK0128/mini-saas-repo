import { IntersectionType, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { Term, TermAgreement, TermCategory } from '@/entities';

export class GetTermsDto {
  @IsString()
  @IsOptional()
  token?: string;
}

export class GetTermsResponseDto
  extends IntersectionType(
    Term,
    PickType(TermCategory, ['isActive', 'termType', 'title', 'organization']),
    PickType(TermAgreement, ['agreedAt']),
  ) {
}
