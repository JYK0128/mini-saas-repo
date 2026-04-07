import { ApiProperty } from '@nestjs/swagger';

export class ServicePlanResponseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  monthlyPrice!: number;

  @ApiProperty()
  features!: string[];

  @ApiProperty()
  createdAt!: Date;
}
