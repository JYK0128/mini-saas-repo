import { OmitType, PickType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsStrongPassword, Length } from 'class-validator';

import { Account, User } from '@/entities';

export class LoginDto
  extends PickType(Account, ['accountId', 'password']) {
  @IsEmail()
  override accountId!: string;

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 1 })
  override password!: string;

  @Length(6, 6)
  @IsOptional()
  token?: string;
}

export class LoginResponseDto
  extends OmitType(User, ['twoFactorSecret', 'account']) {

}
