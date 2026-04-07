import { PickType } from '@nestjs/swagger';
import { IsStrongPassword, Length } from 'class-validator';

import { Match } from '@/common/decorators';
import { Verification } from '@/entities';

export class ResetPasswordDto
  extends PickType(Verification, ['identifier']) {
  @Length(1)
  override identifier!: string;

  @Length(6, 6)
  token!: string;

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 1 })
  password!: string;

  @Match('password')
  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 1 })
  confirmPassword!: string;
}
