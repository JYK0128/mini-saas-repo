import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Organization } from '@/entities';

import { ServiceSettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';

@Module({
  imports: [MikroOrmModule.forFeature([Organization])],
  controllers: [ServiceSettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class ServiceSettlementModule {}
