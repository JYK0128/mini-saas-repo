import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Member, Organization } from '@/entities';

import { DashboardService } from './dashboard.service';
import { ServiceDashboardController } from './service-dashboard.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([Organization, Member]),
  ],
  controllers: [ServiceDashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class ServiceDashboardModule {}
