import { ApiProperty } from '@nestjs/swagger';

export class ServiceSettlementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  status!: 'PENDING' | 'COMPLETED' | 'FAILED';

  @ApiProperty()
  settledAt?: Date;

  @ApiProperty()
  createdAt!: Date;
}
