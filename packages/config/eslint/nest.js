import { defineConfig } from 'eslint/config';
import globals from 'globals';

import baseConfig from './base.js';

/** @type {import("eslint").Linter.Config[]} */
export default defineConfig([
  baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
]);
