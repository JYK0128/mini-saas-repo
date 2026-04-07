import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Audit } from '@/entities';

import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [MikroOrmModule.forFeature([Audit])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class PlatformAuditModule {}
