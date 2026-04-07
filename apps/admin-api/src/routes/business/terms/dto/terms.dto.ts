import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { TermType } from '@/entities';

export class CreateTermDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  version!: string;

  @ApiProperty({ enum: TermType })
  @IsEnum(TermType)
  termType!: TermType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateTermDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsEnum(TermType)
  @IsOptional()
  termType?: TermType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class TermResponseDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  @IsOptional()
  versionId?: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  version!: string;

  @ApiProperty({ enum: TermType })
  @IsEnum(TermType)
  termType!: TermType;

  @IsBoolean()
  isActive!: boolean;

  @IsDateString()
  startDate!: Date;

  @IsOptional()
  endDate?: Date;

  @IsDateString()
  updatedAt!: Date;

  @IsDateString()
  createdAt!: Date;
}
