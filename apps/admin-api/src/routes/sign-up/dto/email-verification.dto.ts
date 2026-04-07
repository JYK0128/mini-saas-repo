import { PickType } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

import { User } from '@/entities';

export class RequestEmailVerificationDto
  extends PickType(User, ['email'] as const) {
  @IsEmail()
  override email!: string;
}

export class ConfirmEmailVerificationDto {
  @IsString()
  id!: string;

  @Length(6, 6)
  token!: string;
}

export class ResendEmailVerificationDto
  extends PickType(User, ['email']) {
  @IsEmail()
  override email!: string;
}
