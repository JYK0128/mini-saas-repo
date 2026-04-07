import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  monthlyPrice!: number;

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  features!: string[];
}

export class PlanResponseDto extends CreatePlanDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  createdAt!: Date;
}
