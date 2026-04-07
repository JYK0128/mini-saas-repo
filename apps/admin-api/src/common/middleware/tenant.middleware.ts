import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { OrganizationRepository } from '@/entities/organization/organization.repository';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const host = req.headers.host;
      if (!host) {
        return next();
      }

      // Example logic:
      // 1. Check for subdomain: {slug}.localhost:4000
      // 2. Check for custom domain in metadata

      const parts = host.split('.');

      // Subdomain check (excluding common ones)
      if (parts.length > 1 && !['localhost', 'www'].includes(parts[0])) {
        const slug = parts[0];
        const org = await this.orgRepo.findOne({ slug });
        if (org) {
          req['tenantId'] = org.id;
          req['tenant'] = org;
          return next();
        }
      }

      // Custom domain check
      // We search organizations where metadata.customDomain matches the host
      const orgByDomain = await this.orgRepo.findOne({
        metadata: { customDomain: host },
      });

      if (orgByDomain) {
        req['tenantId'] = orgByDomain.id;
        req['tenant'] = orgByDomain;
      }
    }
    catch (error) {
      // Log error but don't block the request
      console.error('TenantMiddleware Error:', error);
    }

    next();
  }
}
