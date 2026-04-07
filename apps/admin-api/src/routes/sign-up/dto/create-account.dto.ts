import { IntersectionType, PickType } from '@nestjs/swagger';
import { ArrayNotEmpty, IsEmail, IsNotEmpty, IsPhoneNumber, IsString, IsStrongPassword } from 'class-validator';

import { Match } from '@/common/decorators';
import { Account, User } from '@/entities';

export class CreateAccountDto
  extends IntersectionType(
    PickType(User, ['name', 'email', 'phoneNumber']),
    PickType(Account, ['password']),
  ) {
  @IsString()
  @IsNotEmpty()
  override name!: string;

  @IsEmail()
  override email!: string;

  @IsPhoneNumber()
  override phoneNumber!: string;

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 1 })
  override password!: string;

  @Match('password')
  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 1 })
  confirmPassword!: string;

  @IsString({ each: true })
  @ArrayNotEmpty()
  termIds!: string[];
}
