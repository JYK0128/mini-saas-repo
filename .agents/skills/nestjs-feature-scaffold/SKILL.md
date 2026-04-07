---
name: nestjs-feature-scaffold
description: Scaffold new backend features in a NestJS project using MikroORM and Kysely. This skill provides instructions and templates for creating Entities, Repositories, DTOs, Services, Controllers, and Modules according to the project's architecture.
---

# NestJS + MikroORM + Kysely Feature Scaffold

Use this skill to create new backend features (modules) in the `admin-api` project.

## Architecture Overview

- **Entity**: Defined in `src/entities/<feature>/<feature>.entity.ts`. Extends `CoreEntity`.
- **Repository**: Defined in `src/entities/<feature>/<feature>.repository.ts`. Extends `CoreRepository<EntityName>`. Uses Kysely for complex queries.
- **Module/Service/Controller**: Defined in `src/routes/<category>/<feature>/`.
- **Category**: Could be `platform`, `business`, etc.
- **DTO**: Defined in `src/routes/<category>/<feature>/dto/`.

### Common Folder Structure (`src/common`)

- **decorators**: Custom NestJS/MikroORM decorators.
- **dto**: Global DTOs (e.g., `ResponseDto`).
- **exceptions**: Custom error exceptions (`ErrorException`).
- **filters**: Global exception filters.
- **guards**: Auth and Permission guards.
- **interceptors**: Logging or response formatting interceptors.
- **middleware**: Express middleware.
- **tools**: Utility functions.
- **types**: Global TypeScript types and interfaces.

---

## 1. Create Entity & Repository

In `src/entities/<feature-name>/`:

- **Rule**: Always extend `CoreEntity` and `CoreRepository`. Use Kysely for any query involving joins or complex filters to ensure performance and type safety.

### [Entity] `audit.entity.ts`

```typescript
import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { CoreEntity } from '../_common/core.entity';
import { AuditRepository } from './audit.repository';

@Entity({ 
  schema: 'platform',
  repository: () => AuditRepository 
})
export class Audit extends CoreEntity<Audit, keyof Audit> {
  [EntityRepositoryType]?: AuditRepository;

  @Property({ type: 'string' })
  url!: string;

  @Property({ type: 'string' })
  method!: string;

  @Property({ type: 'json', nullable: true })
  payload?: any;

  @Property({ type: 'string', nullable: true })
  userId?: string;

  @Property({ type: 'string', nullable: true })
  organizationId?: string;
}
```

### [Repository] `audit.repository.ts`

```typescript
import { CoreRepository } from '../_common/core.repository';
import { Audit } from './audit.entity';
import type { DB } from '@/database/types/db';

export class AuditRepository extends CoreRepository<Audit> {
  /**
   * Rule: Use Kysely for joins. Encapsulate query logic here.
   */
  async searchAudits(params: {
    limit: number;
    offset: number;
    organizationId?: string;
    userId?: string;
  }) {
    const kysely = this.em.getKysely<DB>();
    
    let query = kysely
      .selectFrom('platform.audit as a')
      .leftJoin('platform.user as u', 'a.user_id', 'u.id')
      .leftJoin('platform.organization as o', 'a.organization_id', 'o.id')
      .select([
        'a.id',
        'a.url',
        'a.method',
        'a.created_at as createdAt',
        'u.name as userName',
        'o.name as organizationName',
      ]);

    if (params.organizationId) {
      query = query.where('a.organization_id', '=', params.organizationId);
    }

    if (params.userId) {
      query = query.where('a.user_id', '=', params.userId);
    }

    return await query
      .orderBy('a.created_at', 'desc')
      .limit(params.limit)
      .offset(params.offset)
      .execute();
  }
}
```

---

## 2. Create Routes (Module, Service, Controller, DTO)

In `src/routes/platform/audit/`:

### [Service] `audit.service.ts`

- **Rules**:
  1. **Business Logic**: Orchestrate repositories and handle domain rules.
  2. **Error Handling**: Throw `ErrorException` with meaningful keys and status codes.
  3. **Abstraction**: Do not expose DB-specific details to the Controller.

```typescript
import { Injectable, HttpStatus } from '@nestjs/common';
import { AuditRepository } from '@/entities';
import { ErrorException } from '@/common/exceptions/error.exception';
import { AuditSearchDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepo: AuditRepository) {}

  async getAuditLogs(dto: AuditSearchDto, requesterOrgId?: string) {
    const { page = 1, limit = 20, organizationId } = dto;
    
    // Example Logic: Business rules for cross-org access
    const targetOrgId = requesterOrgId || organizationId;
    if (!targetOrgId) {
      throw new ErrorException('ORG_CONTEXT_REQUIRED', HttpStatus.BAD_REQUEST);
    }

    const items = await this.auditRepo.searchAudits({
      limit,
      offset: (page - 1) * limit,
      organizationId: targetOrgId,
      userId: dto.userId,
    });

    const total = await this.auditRepo.count({ organizationId: targetOrgId });

    return { items, total, page, limit };
  }
}
```

### [Controller] `audit.controller.ts`

- **Rules**:
  1. **Thin Layer**: Only handle routing, DTO mapping, and Swagger decorators.
  2. **Contract**: Define clear `@ApiResponse` and `@ApiTags`.
  3. **Validation**: Rely on DTO `class-validator` decorators.

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditSearchDto, AuditListResponseDto } from './dto/audit.dto';
import { AuthGuard } from '@/common/guards/auth.guard';

@ApiTags('Audit')
@Controller('platform/audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: '감사 로그 검색' })
  @ApiResponse({ type: AuditListResponseDto })
  async findAll(@Query() dto: AuditSearchDto) {
    return this.auditService.getAuditLogs(dto);
  }
}
```

---

## 3. Test Code Style

Create `<feature-name>.service.spec.ts` or `<feature-name>.controller.spec.ts`.

### [Testing Pattern]

Use the `withRequestContext` helper to wrap database-interacting code. Import `AppModule` for integration testing.

```typescript
import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { <FeatureName>Service } from './<feature-name>.service';
import { <FeatureName> } from '@/entities';

describe('<FeatureName>Service', () => {
  let service: <FeatureName>Service;
  let orm: MikroORM;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) => {
    const em = orm.em.fork();
    return RequestContext.create(em, () => callback(em));
  };

  const cleanup = async (name: string) => {
    await withRequestContext(async (em) => {
      await em.nativeDelete(<FeatureName>, { name });
      await em.flush();
    });
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<<FeatureName>Service>(<FeatureName>Service);
    orm = module.get<MikroORM>(MikroORM);

    await cleanup('test-item'); // Ensure clean state before tests
  });

  afterAll(async () => {
    await cleanup('test-item'); // Cleanup after tests
    await orm.close();
  });

  it('should create and find', async () => {
    await withRequestContext(async (em) => {
      // Test logic here
    });
  });
});
```

---

## 4. Post-Creation Steps

1. **Register Entity**: Add to `src/entities/index.ts`.
2. **Register Module**: Add to `src/routes/index.ts` or the appropriate category module.
3. **i18n**: Add translation keys in `src/i18n/ko/` and `src/i18n/en/` if custom labels or error messages are needed.
4. **CLI Updates**:
   - `npm run update:orm`: Create MikroORM migration.
   - `npm run update:db`: Apply migration to local DB.
   - `npm run setup:kysely`: Update Kysely database types (`db.d.ts`).
   - `npm run setup:swagger`: Update Swagger metadata.
5. **Frontend Sync**:
   - Go to `apps/admin-web/` and run `npm run set-up` to update Orval generated hooks.
