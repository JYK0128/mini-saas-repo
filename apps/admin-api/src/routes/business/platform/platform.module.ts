import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Organization } from '@/entities';

import { ServiceDashboardModule } from '../dashboard/dashboard.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Organization]),
    ServiceDashboardModule,
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class ServicePlatformModule {}
