import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { User } from '@/entities';

import { SupportController } from './support.controller';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [SupportController],
})
export class SupportModule {}
