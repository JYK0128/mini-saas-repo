import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Account, Invitation, Member, Term, TermAgreement, User, Verification } from '@/entities';

import { SignUpController } from './sign-up.controller';
import { SignUpService } from './sign-up.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      User,
      Account,
      Verification,
      Term,
      TermAgreement,
      Invitation,
      Member,
    ]),
  ],
  controllers: [SignUpController],
  providers: [SignUpService],
})
export class SignUpModule {}
