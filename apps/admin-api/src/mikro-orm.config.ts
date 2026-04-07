import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { type Options } from '@mikro-orm/postgresql';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

import * as Entities from '@/entities';
import { CamelCaseNamingStrategy } from '@/mikro-orm.naming';

const sourceDir = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

export default {
  entities: Object.values(Entities).filter((e) => typeof e === 'function'),
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL,
  metadataProvider: ReflectMetadataProvider,
  namingStrategy: CamelCaseNamingStrategy,
  filters: {
    softDeletable: {
      cond: { deletedAt: { $eq: null } },
      default: true,
    },
  },
  extensions: [SeedManager, EntityGenerator, Migrator],
  migrations: {
    path: path.resolve(sourceDir, './database/migrations'),
    safe: true,
  },
  seeder: {
    path: path.resolve(sourceDir, './database/seeders'),
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
  },
  debug: !['production'].includes(process.env.NODE_ENV || '')
    ? ['query', 'query-params']
    : false,
  highlighter: new SqlHighlighter(),
  ignoreUndefinedInQuery: true,
} satisfies Options;
