import { PickType } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, Length } from 'class-validator';

import { User } from '@/entities';

export class FindIdDto
  extends PickType(User, ['name', 'phoneNumber']) {
  @Length(1)
  override name!: string;

  @IsPhoneNumber()
  override phoneNumber!: string;
}

export class FindIdResponseDto
  extends PickType(User, ['email']) {
  @IsEmail()
  override email!: string;
}
