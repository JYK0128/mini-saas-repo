import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Length } from 'class-validator';

export class CreateSettlementDto {
  @ApiProperty()
  @Length(1)
  organizationId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;
}

export class SettlementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  organizationName!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  status!: 'PENDING' | 'COMPLETED' | 'FAILED';

  @ApiProperty()
  settledAt?: Date;

  @ApiProperty()
  createdAt!: Date;
}
