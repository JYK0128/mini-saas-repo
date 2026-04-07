import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Organization } from '@/entities';

import { ServiceSettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [MikroOrmModule.forFeature([Organization])],
  controllers: [ServiceSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class ServiceSettingsModule {}
