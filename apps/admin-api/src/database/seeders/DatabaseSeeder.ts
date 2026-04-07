import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { PlatformSeeder } from './PlatformSeeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // Call other seeders here
    await this.call(em, [PlatformSeeder]);
  }
}
