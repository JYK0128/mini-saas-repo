import { PickType } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, Length } from 'class-validator';

import { User } from '@/entities';

export class FindPasswordDto
  extends PickType(User, ['email', 'name', 'phoneNumber'] as const) {
  @IsEmail()
  override email!: string;

  @Length(1)
  override name!: string;

  @IsPhoneNumber()
  override phoneNumber!: string;
}
