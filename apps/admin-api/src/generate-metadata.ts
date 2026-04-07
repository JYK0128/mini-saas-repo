import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator.js';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin/index.js';

const sourceDir = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

const generator = new PluginMetadataGenerator();
generator.generate({
  visitors: [
    new ReadonlyVisitor({
      introspectComments: true,
      classValidatorShim: true,
      pathToSource: sourceDir,
      dtoFileNameSuffix: ['.dto.ts', '.entity.ts', '.core.ts'],
    }),
  ],
  outputDir: sourceDir,
  watch: false,
  tsconfigPath: 'tsconfig.app.json',
});
