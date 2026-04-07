import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Organization } from '@/entities';

import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [MikroOrmModule.forFeature([Organization])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class PlatformSettingsModule {}
