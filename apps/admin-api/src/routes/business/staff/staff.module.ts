import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Invitation, Member, Organization, Term, TermAgreement, User, Verification } from '@/entities';

import { ServiceStaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [MikroOrmModule.forFeature([Member, User, Organization, Invitation, Verification, Term, TermAgreement])],
  controllers: [ServiceStaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class ServiceStaffModule {}
