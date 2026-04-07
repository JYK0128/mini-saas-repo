import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Organization } from '@/entities';

import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [MikroOrmModule.forFeature([Organization])],
  controllers: [TenantController],
  providers: [TenantService],
})
export class PlatformTenantModule {}
