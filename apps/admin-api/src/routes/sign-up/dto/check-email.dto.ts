import { PickType } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { User } from '@/entities';

export class CheckEmailDto
  extends PickType(User, ['email'] as const) {
  @IsEmail()
  override email!: string;
}
