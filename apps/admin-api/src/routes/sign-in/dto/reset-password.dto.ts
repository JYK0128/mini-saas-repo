import { IsJWT, IsStrongPassword } from 'class-validator';

import { Match } from '@/common/decorators';

export class ResetPasswordDto {
  @IsJWT()
  token!: string;

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 1 })
  password!: string;

  @Match('password')
  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 1 })
  confirmPassword!: string;
}
