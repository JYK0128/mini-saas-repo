import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsISO8601, Length } from 'class-validator';

import { RoleType } from '@/entities';

export class StaffUserResponseDto {
  @Length(1)
  id!: string;

  @Length(1)
  name!: string;

  @IsEmail()
  email!: string;
}

export class StaffResponseDto {
  @Length(1)
  id!: string;

  @ApiProperty({ enum: RoleType })
  @IsEnum(RoleType)
  role!: RoleType;

  @ApiProperty({ type: StaffUserResponseDto })
  user!: StaffUserResponseDto;

  @IsISO8601()
  createdAt!: Date;
}

export class InviteStaffDto {
  @IsEmail()
  email!: string;

  @Length(1)
  name!: string;

  @ApiProperty({ enum: RoleType })
  @IsEnum(RoleType)
  role!: RoleType;
}

export class UpdateStaffDto {
  @ApiProperty({ enum: RoleType })
  @IsEnum(RoleType)
  role!: RoleType;
}
