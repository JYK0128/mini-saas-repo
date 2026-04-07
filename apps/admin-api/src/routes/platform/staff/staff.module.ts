import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Member, Organization, User } from '@/entities';

import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [MikroOrmModule.forFeature([Member, User, Organization])],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class PlatformStaffModule {}
