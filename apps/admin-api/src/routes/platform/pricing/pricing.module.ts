import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Organization } from '@/entities';

import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

@Module({
  imports: [MikroOrmModule.forFeature([Organization])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PlatformPricingModule {}
