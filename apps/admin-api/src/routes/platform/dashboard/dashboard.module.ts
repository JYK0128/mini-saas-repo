import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Member, Organization } from '@/entities';

import { DashboardService } from './dashboard.service';
import { PlatformDashboardController } from './platform-dashboard.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Organization, Member])],
  controllers: [PlatformDashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class PlatformDashboardModule {}
