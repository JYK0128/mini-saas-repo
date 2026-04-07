import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, Length } from 'class-validator';

import { InvitationStatus, RoleType } from '@/entities';

export class StaffUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}

export class StaffTermAgreementResponseDto {
  @ApiProperty()
  versionId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty({ required: false })
  agreedAt?: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}

export class StaffResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: RoleType })
  role!: RoleType;

  @ApiProperty({ type: StaffUserResponseDto })
  user!: StaffUserResponseDto;

  @ApiProperty({ enum: InvitationStatus })
  status!: InvitationStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: StaffTermAgreementResponseDto, isArray: true, required: false })
  termAgreements?: StaffTermAgreementResponseDto[];
}

export class InviteStaffDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
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
