import { PickType } from '@nestjs/swagger';
import { IsPhoneNumber, Length } from 'class-validator';

import { User } from '@/entities';

export class RequestPhoneVerificationDto
  extends PickType(User, ['phoneNumber'] as const) {
  @IsPhoneNumber()
  override phoneNumber!: string;
}

export class ConfirmPhoneVerificationDto
  extends PickType(User, ['phoneNumber'] as const) {
  @IsPhoneNumber()
  override phoneNumber!: string;

  @Length(6, 6)
  token!: string;
}
