import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Audit } from '@/entities';

import { ServiceAuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [MikroOrmModule.forFeature([Audit])],
  controllers: [ServiceAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class ServiceAuditModule {}
