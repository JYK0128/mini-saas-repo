import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Organization } from '@/entities';

import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';

@Module({
  imports: [MikroOrmModule.forFeature([Organization])],
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class PlatformSettlementModule {}
