import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Term, TermCategory } from '@/entities';

import { ServiceTermsController } from './terms.controller';
import { TermsService } from './terms.service';

@Module({
  imports: [MikroOrmModule.forFeature([TermCategory, Term])],
  controllers: [ServiceTermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class ServiceTermsModule {}
