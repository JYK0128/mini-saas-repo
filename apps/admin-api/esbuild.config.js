import fs from 'node:fs';

import esbuild from 'esbuild';
import { swcPlugin } from 'esbuild-plugin-swc';

import pkg from './package.json' with { type: 'json' };

async function build() {
  const context = await esbuild.context({
    tsconfig: './tsconfig.app.json',
    entryPoints: ['src/main.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    outfile: 'dist/main.js',
    sourcemap: 'inline',
    external: [
      ...Object.keys(pkg.dependencies || {}),
    ],
    plugins: [
      swcPlugin({
        sourceMaps: 'inline',
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'es2022',
          keepClassNames: true,
        },
      }),
    ],
  });

  await context.rebuild();

  // Copy i18n files
  if (fs.existsSync('src/i18n')) {
    fs.cpSync('src/i18n', 'dist/i18n', { recursive: true });
  }

  await context.dispose();
  console.log('Build succeeded');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
