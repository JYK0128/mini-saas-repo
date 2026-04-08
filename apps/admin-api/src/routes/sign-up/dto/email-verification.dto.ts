import { PickType } from '@nestjs/swagger';
import { IsEmail, IsJWT } from 'class-validator';

import { User } from '@/entities';

export class EmailConflictDto
  extends PickType(User, ['email']) {
  @IsEmail()
  override email!: string;
}

export class RequestEmailVerificationDto
  extends PickType(User, ['email']) {
  @IsEmail()
  override email!: string;
}

export class ConfirmEmailVerificationDto {
  @IsJWT()
  token!: string;
}

export class ResendEmailVerificationDto
  extends PickType(User, ['email']) {
  @IsEmail()
  override email!: string;
}
