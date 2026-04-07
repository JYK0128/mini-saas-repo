import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Account, Member, Organization, Term, TermAgreement, User, Verification } from '@/entities';

import { SignInController } from './sign-in.controller';
import { SignInService } from './sign-in.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      User,
      Member,
      Account,
      Verification,
      Organization,
      TermAgreement,
      Term,
    ]),
  ],
  controllers: [SignInController],
  providers: [SignInService],
})
export class SignInModule {}
