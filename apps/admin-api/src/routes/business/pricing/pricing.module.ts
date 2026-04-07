import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Organization } from '@/entities';

import { ServicePricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

@Module({
  imports: [MikroOrmModule.forFeature([Organization])],
  controllers: [ServicePricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class ServicePricingModule {}
