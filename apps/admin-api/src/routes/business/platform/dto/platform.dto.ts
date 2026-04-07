import { ApiProperty } from '@nestjs/swagger';

export class PlatformUsageDto {
  @ApiProperty({ description: 'API 호출 수' })
  apiCalls!: number;

  @ApiProperty({ description: '저장 공간 사용량 (MB)' })
  storageUsed!: number;

  @ApiProperty({ description: '마지막 계산 일시' })
  lastCalculatedAt!: Date;
}

export class PlatformStatusResponseDto {
  @ApiProperty({ description: '조직 ID' })
  id!: string;

  @ApiProperty({ description: '조직명' })
  name!: string;

  @ApiProperty({ description: '조직 슬러그' })
  slug!: string;

  @ApiProperty({ description: '활성화 여부' })
  isActive!: boolean;

  @ApiProperty({ description: '트라이얼 종료일', required: false })
  trialExpiresAt?: Date;

  @ApiProperty({ description: '활성화 종료일', required: false })
  activationExpiresAt?: Date;

  @ApiProperty({ type: PlatformUsageDto, description: '이용 현황' })
  usage!: PlatformUsageDto;
}

export class PlatformPolicyResponseDto {
  @ApiProperty({ description: 'API 호출 제한' })
  apiLimit!: number;

  @ApiProperty({ description: '저장 공간 제한 (MB)' })
  storageLimit!: number;

  @ApiProperty({ description: '허용 기능 목록', type: [String] })
  features!: string[];

  @ApiProperty({ description: '요금제 명칭' })
  planName!: string;
}
